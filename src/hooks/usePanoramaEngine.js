import { useEffect } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export function usePanoramaEngine({
  isReady,
  buildingData,
  currentScene,
  panoramas,
  textureCache,
  containerRef,
  sceneRef,
  cameraRef,
  rendererRef,
  controlsRef,
  clickableRef,
  autorotateTimeoutRef,
  buildHotspots,
  switchPanorama,
  setHistory,
  autorotateSpeed,
  panoMesh1Ref,
  panoMesh2Ref,
}) {

    useEffect(() => {
    if (!isReady || !buildingData.length) return;

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

    const initialTexture =
      textureCache.current[currentScene.images[0].image];

    const panoMesh1 = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        map: initialTexture,
        transparent: true,
        opacity: 1
      })
    );

    const panoMesh2 = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0
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
    const onMouseUp = () => {
      canvas.style.cursor = "grab";
    };

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

      setTimeout(() => {
        canvas.style.cursor = "grab";
      }, 300);
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

      const intersects = raycaster.intersectObjects(
        clickableRef.current
      );

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

      const intersects = raycaster.intersectObjects(
        clickableRef.current,
        true
      );

      if (!intersects.length) return;

      const clicked = intersects[0].object;
      const { type, nextPanorama, buildingSlug, isBack } =
        clicked.userData || {};

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

      if (type === "building" ) {
        const url= clicked.userData.url||'https://wizio.co.uk';
        window.open(url,'_blank');
        return;
      }

      if (type === "unitHotspot" && nextPanorama) {
        const next = panoramas.find(
          (p) => p.id === nextPanorama || p.image === nextPanorama
        );
        if (next) {
          setHistory((h) => [
            ...h,
            JSON.parse(JSON.stringify(currentScene))
          ]);
          switchPanorama(next, buildingSlug, false, true);
        }
        return;
      }

      if (type === "amenity") {
        const np = clicked.userData.nextPanorama;
        const targetScene = panoramas.find((s) => s.id === np);

        if (targetScene) {
          setHistory((h) => [
            ...h,
            JSON.parse(JSON.stringify(currentScene))
          ]);
          switchPanorama(targetScene, null, false, false);
        }
        return;
      }
    };

    canvas.addEventListener("click", onClick);

    const handleResize = () => {
      camera.aspect =
        container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(
        container.clientWidth,
        container.clientHeight
      );
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
      container.removeChild(canvas);

    };
  }, [isReady, buildingData]);
}