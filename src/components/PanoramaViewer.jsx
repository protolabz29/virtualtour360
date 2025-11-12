import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import GUI from "lil-gui";

export default function PanoramaViewer({ panoramas }) {
  const containerRef = useRef(null);
  const textureCache = useRef({});
  const [currentScene, setCurrentScene] = useState(panoramas[0]);
  const [history, setHistory] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState("image");

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const clickableRef = useRef([]);
  const loaderRef = useRef(new THREE.TextureLoader());
  const previousSceneRef = useRef(null);
  const currentSceneRef = useRef(null);

  const panoMesh1Ref = useRef(null);
  const panoMesh2Ref = useRef(null);
  const isTransitioningRef = useRef(false);
  const [usingMesh1, setUsingMesh1] = useState(true);
  const [buildingData, setBuildingData] = useState([]);
  const autorotateSpeed = 0.3;
  const autorotateTimeoutRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    fetch("/buildingData.json")
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) setBuildingData(data);
        else if (Array.isArray(data?.default)) setBuildingData(data.default);
        else setBuildingData([]);
      })
      .catch((err) => {
        console.error("Failed to load buildingData.json:", err);
        if (mounted) setBuildingData([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const loadPromises = panoramas.map(
      (p) =>
        new Promise((resolve) => {
          if (textureCache.current[p.image]) return resolve();
          loader.load(
            p.image,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              tex.generateMipmaps = true;
              textureCache.current[p.image] = tex;
              resolve();
            },
            undefined,
            () => {
              console.warn("Failed to preload:", p.image);
              resolve();
            }
          );
        })
    );
    Promise.all(loadPromises).then(() => setIsReady(true));
  }, [panoramas]);

  const loadTexture = (url) =>
    new Promise((resolve, reject) => {
      if (!url) return reject(new Error("No URL provided"));
      if (textureCache.current[url]) {
        resolve(textureCache.current[url]);
      } else {
        loaderRef.current.load(
          url,
          (tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.generateMipmaps = true;
            textureCache.current[url] = tex;
            resolve(tex);
          },
          undefined,
          (err) => {
            reject(err);
          }
        );
      }
    });

  // buildHotspots with optional mirroring when viewMode === 'mirrored'
const buildHotspots = useCallback(async (sceneData, unitsData = []) => {
    const scene = sceneRef.current;
    const clickable = clickableRef.current;
    const svgLoader = new SVGLoader();

    // Clear old meshes
    clickable.forEach((obj) => scene.remove(obj));
    clickable.length = 0;

    const svgPath = viewMode === "mirrored"
  ? "/assets/svg/units_mir.svg"
  : "/assets/svg/units.svg";

    // Load SVG (units)
    const svgData = await new Promise((resolve, reject) => {
      console.log("Loading SVG for viewMode:", svgPath);
      svgLoader.load(
        svgPath,
        (data) => resolve(data),
        undefined,
        (err) => reject(err)
      );
    });

    // Map paths by id
    const pathsById = {};
    svgData.paths.forEach((path) => {
      const id = path.userData?.node?.id;
      if (id) pathsById[id] = path;
    });

    // Base transform controls (same as you had)
  // ✅ Default base transform for normal & mirrored modes
const controls =
  viewMode === "mirrored"
    ? {
        latitude: 129.7,
        longitude: 22.1,
        radius: 462,
        scale: 0.46,
        offsetX: 87,
        offsetY: -394.5,
        offsetZ: 157.5,
        yaw: -178.7,
        pitch: -156.4,
        roll: -48.1,
        opacity: 0.37,
      }
    : {
        latitude: 108.1,
        longitude: 65.3,
        radius: 637,
        scale: 0.49,
        offsetX: -148.3,
        offsetY: -647.4,
        offsetZ: 377.6,
        yaw: -47.6,
        pitch: -21.4,
        roll: -6.2,
        opacity: 0.37,
      };


   // 🔁 Remove previous SVG group if exists
    const oldGroup = scene.getObjectByName("hotspot-group");
    if (oldGroup) {
      scene.remove(oldGroup);
      oldGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    }
    const group = new THREE.Group();
    group.name = "hotspot-group";
    scene.add(group);


 const rebuildMeshes = () => {
  while (group.children.length > 0) group.remove(group.children[0]);
  clickable.length = 0;

  // keep coordinates same for mirrored mode — just flip horizontally
  const phi = THREE.MathUtils.degToRad(90 - controls.latitude);
  const theta = THREE.MathUtils.degToRad(controls.longitude);
  const basePosition = new THREE.Vector3(
    controls.radius * Math.sin(phi) * Math.cos(theta),
    controls.radius * Math.cos(phi),
    controls.radius * Math.sin(phi) * Math.sin(theta)
  );

  basePosition.x += controls.offsetX;
  basePosition.y += controls.offsetY;
  basePosition.z += controls.offsetZ;

  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(controls.pitch),
    THREE.MathUtils.degToRad(controls.yaw),
    THREE.MathUtils.degToRad(controls.roll),
    "YXZ"
  );
  const rotationQuat = new THREE.Quaternion().setFromEuler(euler);

  // --- BUILDING HOTSPOTS ---
  sceneData.buildings.forEach((b) => {
    const unit = unitsData.find((u) => u.slug === b.svg);
    if (!unit) return;

    let fillColor = "#cccccc";
    if ((unit.status === 1 || unit.status === 2) && unit.building_type.slug === "type_b")
      fillColor = "#FFEB3B";
    else if ((unit.status === 1 || unit.status === 2) && unit.building_type.slug === "type_a")
      fillColor = "#2196F3";
    else if (unit.status === 3) fillColor = "#F44336";

    const path = pathsById[b.svg];
    if (!path) return;

    const shapes = SVGLoader.createShapes(path);
    shapes.forEach((shape) => {
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(fillColor),
        transparent: true,
        opacity: controls.opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(controls.scale, -controls.scale, controls.scale);
      mesh.position.copy(basePosition);
      mesh.lookAt(0, 0, 0);
      mesh.quaternion.multiply(rotationQuat);

      // 🪞 Flip horizontally if mirrored
      if (viewMode === "mirrored") {
        // Reverse X coordinates and quaternion
        mesh.scale.x *= -1;   // Mirror horizontally
        mesh.rotation.y += Math.PI; // Face correct way
      }

      mesh.renderOrder = 10;
      mesh.userData = {
        type: "building",
        buildingSlug: b.svg,
        nextPanorama: b.nextPanorama,
      };

      clickable.push(mesh);
      group.add(mesh);
    });
  });

  // --- AMENITIES (optional mirror if desired) ---
  if (sceneData.amenities?.length) {
    const amenityGeometry = new THREE.SphereGeometry(8, 24, 24);
    const categoryColors = {
      Restaurants: "#FF9800",
      Beach: "#00BCD4",
      Shopping: "#8BC34A",
      Transport: "#E91E63",
    };

    const RADIUS = 500;
    sceneData.amenities.forEach((amenity) => {
      if (!amenity.location) return;
      const [latStr, lngStr] = amenity.location.split(",").map((v) => parseFloat(v.trim()));
      if (isNaN(latStr) || isNaN(lngStr)) return;

      const phiA = THREE.MathUtils.degToRad(90 - latStr);
      const thetaA = THREE.MathUtils.degToRad(lngStr + 180);
      let x = RADIUS * Math.sin(phiA) * Math.cos(thetaA);
      const y = RADIUS * Math.cos(phiA);
      let z = RADIUS * Math.sin(phiA) * Math.sin(thetaA);

      // 🪞 Flip coordinates for mirrored mode
      if (viewMode === "mirrored") {
        x *= -1;
      }

      const mesh = new THREE.Mesh(
        amenityGeometry,
        new THREE.MeshBasicMaterial({
          color: categoryColors[amenity.category] || "#FFFFFF",
          transparent: true,
          opacity: 0.85,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      mesh.position.set(x, y, z);
      mesh.lookAt(0, 0, 0);
      mesh.renderOrder = 15;
      mesh.userData = {
        type: "amenity",
        name: amenity.name,
        category: amenity.category,
        nextPanorama: amenity.id,
      };
      clickable.push(mesh);
      group.add(mesh);
    });
  }
};
//  if (window._mirroredGui) {
//     window._mirroredGui.destroy();
//     window._mirroredGui = null;
//   }

//   if (viewMode === "mirrored") {
//     const gui = new GUI({ width: 320 });
//     window._mirroredGui = gui;

//     const folder = gui.addFolder("Mirrored SVG Alignment");
//     folder.add(controls, "latitude", 0, 180, 0.1).onChange(rebuildMeshes);
//     folder.add(controls, "longitude", 0, 360, 0.1).onChange(rebuildMeshes);
//     folder.add(controls, "radius", 100, 1000, 1).onChange(rebuildMeshes);
//     folder.add(controls, "scale", 0.1, 2, 0.01).onChange(rebuildMeshes);

//     const offsetFolder = folder.addFolder("Offset");
//     offsetFolder
//       .add(controls, "offsetX", -1000, 1000, 0.5)
//       .onChange(rebuildMeshes);
//     offsetFolder
//       .add(controls, "offsetY", -1000, 1000, 0.5)
//       .onChange(rebuildMeshes);
//     offsetFolder
//       .add(controls, "offsetZ", -1000, 1000, 0.5)
//       .onChange(rebuildMeshes);

//     const rotationFolder = folder.addFolder("Rotation");
//     rotationFolder.add(controls, "yaw", -200, 200, 0.1).onChange(rebuildMeshes);
//     rotationFolder
//       .add(controls, "pitch", -180, 180, 0.1)
//       .onChange(rebuildMeshes);
//     rotationFolder.add(controls, "roll", -180, 180, 0.1).onChange(rebuildMeshes);

//     folder.add(controls, "opacity", 0, 1, 0.01).onChange(rebuildMeshes);
//     folder.open();
//   }

    rebuildMeshes();
 }, [viewMode]);

  // switchPanorama now respects viewMode for selecting mirrored image
  const switchPanorama = async (nextScene, currentSlug, isBack = false, isUnitScene = false) => {
    if (!nextScene || isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    // store previous panorama reference
    if (!isBack && currentSceneRef.current) {
      previousSceneRef.current = currentSceneRef.current;
    }
    currentSceneRef.current = nextScene;

    // reset camera & disable controls
    if (cameraRef.current) {
      cameraRef.current.position.set(0.6, 0.3, 0.1);
      cameraRef.current.updateProjectionMatrix?.();
    }
    if (controlsRef.current) {
      controlsRef.current.enabled = false;
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }

    // decide image based on viewMode (use imageMirrored if available)
    const imgUrl =
      viewMode === "mirrored" && nextScene.imageMirrored ? nextScene.imageMirrored : nextScene.image;

    const nextTexture = await loadTexture(imgUrl).catch(() => null);
    if (!nextTexture) {
      if (controlsRef.current) controlsRef.current.enabled = true;
      isTransitioningRef.current = false;
      return;
    }

    const nextMesh = usingMesh1 ? panoMesh2Ref.current : panoMesh1Ref.current;
    const currentMesh = usingMesh1 ? panoMesh1Ref.current : panoMesh2Ref.current;

    nextMesh.material.map = nextTexture;
    nextMesh.material.opacity = 0;
    nextMesh.material.transparent = true;
    nextMesh.material.needsUpdate = true;

    const scene = sceneRef.current;
    const loader = loaderRef.current;
    const clickable = clickableRef.current;

    clickable.forEach((obj) => {
      if (obj.parent) obj.parent.remove(obj);
    });
    clickable.length = 0;

    const currentUnit = currentSlug ? buildingData.find((b) => b.slug === currentSlug) : null;

    // unit hotspots for unit panoramas (unchanged)
    if (!isUnitScene && currentUnit && currentUnit.panoramas?.length) {
  currentUnit.panoramas.forEach((panoramaId) => {
    // find matching panorama data from master panoramas list
    const panoramaData = panoramas.find((p) => p.id === panoramaId);
    if (!panoramaData || !panoramaData.hotspots) return;

    panoramaData.hotspots.forEach((b) => {
      loader.load(
        "/assets/svg/oval.svg",
        (svgTexture) => {
          svgTexture.colorSpace = THREE.SRGBColorSpace;
          const mat = new THREE.MeshBasicMaterial({
            map: svgTexture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false,
          });

          const plane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), mat);
          const phi = THREE.MathUtils.degToRad(90 - b.latitude);
          const theta = THREE.MathUtils.degToRad(b.longitude);
          plane.position.set(
            65 * Math.sin(phi) * Math.cos(theta),
            65 * Math.cos(phi),
            65 * Math.sin(phi) * Math.sin(theta)
          );

          plane.lookAt(0, 0, 0);
          plane.rotation.z = THREE.MathUtils.degToRad(118.6);

          const aspect =
            plane.material.map.image?.width /
              plane.material.map.image?.height || 1;
          plane.geometry.dispose();
          plane.geometry = new THREE.PlaneGeometry(
            40 * aspect * 0.35,
            40 * 0.35
          );

          plane.userData = {
            type: "unitHotspot",
            nextPanorama: b.image,
            buildingSlug: currentSlug,
          };

          plane.renderOrder = 1;
          scene.add(plane);
          clickable.push(plane);
        },
        undefined,
        (err) => console.error("Error loading SVG:", err)
      );
    });
  });
}


    // back hotspot when appropriate
    if (previousSceneRef.current && isUnitScene && isBack === false) {
      loader.load(
        "/assets/svg/oval.svg",
        (svgTexture) => {
          svgTexture.colorSpace = THREE.SRGBColorSpace;
          const mat = new THREE.MeshBasicMaterial({
            map: svgTexture,
            transparent: true,
            opacity: 1,
            side: THREE.DoubleSide,
            depthWrite: false,
          });

          const plane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), mat);
          const phi = THREE.MathUtils.degToRad(95);
          const theta = THREE.MathUtils.degToRad(-60);
          plane.position.set(
            65 * Math.sin(phi) * Math.cos(theta),
            65 * Math.cos(phi),
            65 * Math.sin(phi) * Math.sin(theta)
          );

          plane.lookAt(0, 0, 0);
          plane.rotation.z = THREE.MathUtils.degToRad(0);

          const aspect = plane.material.map.image?.width / plane.material.map.image?.height || 1;
          plane.geometry.dispose();
          plane.geometry = new THREE.PlaneGeometry(40 * aspect * 0.35, 40 * 0.35);

          plane.userData = {
            type: "backHotspot",
            nextPanorama: previousSceneRef.current,
            isBack: true,
            buildingSlug: currentSlug,
          };

          plane.renderOrder = 2;
          scene.add(plane);
          clickable.push(plane);
        },
        undefined,
        (err) => console.error("Error loading back.svg:", err)
      );
    }

    // building hotspots loaded as images (existing logic)
    const newHotspots = [];
    if (nextScene.buildings?.length) {
      await Promise.all(
        nextScene.buildings.map(
          (b) =>
            new Promise((resolve) => {
              loader.load(
                b.svg,
                (svgTexture) => {
                  try {
                    svgTexture.colorSpace = THREE.SRGBColorSpace;
                  } catch (e) {}
                  const mat = new THREE.MeshBasicMaterial({
                    map: svgTexture,
                    transparent: true,
                    opacity: 1,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                  });
                  const plane = new THREE.Mesh(new THREE.PlaneGeometry(50, 50), mat);
                  const phi = THREE.MathUtils.degToRad(90 - (b.latitude || 0));
                  // Mirror longitude for image-based hotspots if viewMode === 'mirrored'
                  let longitudeForHotspot = b.longitude || 0;
                  if (viewMode === "mirrored") {
                    longitudeForHotspot = -longitudeForHotspot;
                  }
                  const theta = THREE.MathUtils.degToRad(longitudeForHotspot);
                  plane.position.set(
                    (b.radius || 65) * Math.sin(phi) * Math.cos(theta),
                    (b.radius || 65) * Math.cos(phi),
                    (b.radius || 65) * Math.sin(phi) * Math.sin(theta)
                  );
                  plane.lookAt(0, 0, 0);
                  plane.rotation.z = THREE.MathUtils.degToRad(b.rotation || 0);

                  const aspect =
                    plane.material.map?.image?.width / plane.material.map?.image?.height || 1;
                  plane.geometry.dispose();
                  plane.geometry = new THREE.PlaneGeometry((b.size || 50) * aspect, b.size || 50);

                  plane.userData = {
                    type: "building",
                    buildingSlug: b.svg,
                    nextPanorama: b.nextPanorama,
                  };
                  plane.renderOrder = 1;

                  // If using mirrored view mode, flip horizontally
                  if (viewMode === "mirrored") {
                    plane.scale.x *= -1;
                  }

                  newHotspots.push(plane);
                  resolve();
                },
                undefined,
                () => resolve()
              );
            })
        )
      );
    }

    // fade animation between meshes
    let opacity = 0;
    const speed = 0.02;
    await new Promise((resolve) => {
      const animateFade = () => {
        opacity += speed;
        if (opacity > 1) opacity = 1;

        nextMesh.material.opacity = opacity;
        currentMesh.material.opacity = 1 - opacity;

        if (opacity < 1) {
          requestAnimationFrame(animateFade);
        } else {
          resolve();
        }
      };
      animateFade();
    });

    // add new hotspots
    newHotspots.forEach((m) => {
      scene.add(m);
      clickable.push(m);
    });

    setUsingMesh1((v) => !v);
    currentMesh.material.opacity = 0;
    nextMesh.material.opacity = 1;
    setCurrentScene(nextScene);

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      controlsRef.current.enabled = true;
    }

    clearTimeout(autorotateTimeoutRef.current);
    autorotateTimeoutRef.current = setTimeout(() => {
      if (controlsRef.current) controlsRef.current.autoRotate = true;
    }, 2000);

    isTransitioningRef.current = false;
  };

  useEffect(() => {
    if (!isReady) return;
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1);

    const initialTexture = textureCache.current[currentScene.image];
    const panoMesh1 = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: initialTexture,
        transparent: true,
        opacity: 1,
      })
    );
    const panoMesh2 = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
      })
    );

    scene.add(panoMesh1);
    scene.add(panoMesh2);
    panoMesh1Ref.current = panoMesh1;
    panoMesh2Ref.current = panoMesh2;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableZoom = true;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.rotateSpeed = -0.3;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = autorotateSpeed;

    camera.position.set(0.6, 0.3, 0.1);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;
    controlsRef.current = controls;

    // initial build
    buildHotspots(currentScene, buildingData);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredObject = null;

    const canvas = renderer.domElement;
    canvas.style.cursor = "grab";

    const stopRotation = () => {
      if (controls.autoRotate) controls.autoRotate = false;
      clearTimeout(autorotateTimeoutRef.current);
    };

    const onMouseEnter = () => (canvas.style.cursor = "grab");
    const onMouseLeave = () => (canvas.style.cursor = "default");
    const onMouseDown = () => {
      canvas.style.cursor = "grabbing";
      stopRotation();
    };
    const onMouseUp = () => (canvas.style.cursor = "grab");

    const onWheel = (event) => {
      event.preventDefault();
      stopRotation();
      canvas.style.cursor = "grabbing";

      if (camera.fov) {
        const zoomSpeed = 6;
        camera.fov += event.deltaY * 0.01 * zoomSpeed;
        camera.fov = THREE.MathUtils.clamp(camera.fov, 30, 90);
        camera.updateProjectionMatrix();
      }

      setTimeout(() => (canvas.style.cursor = "grab"), 300);
    };

    canvas.addEventListener("mouseenter", onMouseEnter);
    canvas.addEventListener("mouseleave", onMouseLeave);
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("wheel", onWheel);

    const onMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableRef.current);
      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (hoveredObject !== obj) {
          if (hoveredObject) hoveredObject.material.opacity = 0.4;
          hoveredObject = obj;
          hoveredObject.material.opacity = 0.2;
        }
      } else {
        if (hoveredObject) hoveredObject.material.opacity = 0.4;
        hoveredObject = null;
      }
    };
    canvas.addEventListener("mousemove", onMouseMove);

    const onClick = async (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(clickableRef.current, true);
      if (!intersects.length) return;

      const clicked = intersects[0].object;
      const { type, nextPanorama, buildingSlug, isBack } = clicked.userData || {};

      if (type === "backHotspot" && isBack && nextPanorama) {
        const previousScene =
          typeof nextPanorama === "string"
            ? panoramas.find((p) => p.id === nextPanorama)
            : nextPanorama;

        if (previousScene) {
          switchPanorama(previousScene, buildingSlug, true);
        }
        return;
      }

      if (type === "building" && nextPanorama) {
        const next = panoramas.find((p) => p.id === nextPanorama || p.image === nextPanorama);
        if (next) {
          setHistory((h) => [...h, JSON.parse(JSON.stringify(currentScene))]);
          switchPanorama(next, buildingSlug || null);
        }
        return;
      }

      if (type === "unitHotspot" && nextPanorama) {
        const next = panoramas.find((p) => p.id === nextPanorama || p.image === nextPanorama);
        if (next) {
          setHistory((h) => [...h, JSON.parse(JSON.stringify(currentScene))]);
          switchPanorama(next, buildingSlug, false, true);
        }
        return;
      }

      if (type === "amenity") {
        const { nextPanorama: np } = clicked.userData;
        const targetScene = panoramas.find((s) => s.id === np);
        if (targetScene) {
          setHistory((h) => [...h, JSON.parse(JSON.stringify(currentScene))]);
          switchPanorama(targetScene, null, false, false);
        } else {
          console.warn("No matching panorama found for:", np);
        }
        return;
      }

      console.warn("⚠️ Unrecognized hotspot clicked:", clicked.userData);
    };

    canvas.addEventListener("click", onClick);

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("click", onClick);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mouseenter", onMouseEnter);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      renderer.dispose();
      try {
        container.removeChild(canvas);
      } catch (e) {}
    };
  }, [isReady]); // we only re-create the scene when ready

  const goBack = async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    await switchPanorama(prev, prev.slug || null);
    await buildHotspots(prev, buildingData);
  };
useEffect(() => {
  if (!isReady) return;

  // Step 1: switch to mirrored (or normal) panorama
  const updatePanoramaAndHotspots = async () => {
    await switchPanorama(currentScene, null); // ensures texture transition completes
    // Step 2: rebuild SVG overlays after fade-in
    await buildHotspots(currentScene, buildingData);
  };

  // Small delay to let the fade animation in switchPanorama settle
  setTimeout(() => {
    updatePanoramaAndHotspots();
  }, 400); // 400–600ms is usually good for your 0.02 fade speed

}, [viewMode]);


  if (!isReady) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-black text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" style={{ background: "black" }} />

      <div className="absolute top-4 right-4 z-20 p-2 bg-black rounded">
        <select
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          className="bg-black text-white p-1 rounded"
        >
          <option value="image">Image</option>
          <option value="mirrored">Mirrored Image</option>
        </select>
      </div>

      {history.length > 0 && (
        <button
          onClick={goBack}
          className="absolute top-4 left-4 z-10 px-4 py-2 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-md transition-all duration-300"
        >
          ← Back
        </button>
      )}
    </div>
  );
}
