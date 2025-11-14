import { useCallback } from "react";
import * as THREE from "three";

export function usePanoramaSwitcher({
  panoramas,
  viewMode,
  buildingData,
  sceneRef,
  cameraRef,
  controlsRef,
  loaderRef,
  clickableRef,
  panoMesh1Ref,
  panoMesh2Ref,
  previousSceneRef,
  currentSceneRef,
  isTransitioningRef,
  autorotateTimeoutRef,
  setUsingMesh1,
  usingMesh1,
  setCurrentScene,
  loadTexture,
  getImageUrl,
}) {
  const switchPanorama = useCallback(
    async (nextScene, currentSlug, isBack = false, isUnitScene = false) => {
      if (!nextScene || isTransitioningRef.current) return;

      isTransitioningRef.current = true;

      if (!isBack && currentSceneRef.current) {
        previousSceneRef.current = currentSceneRef.current;
      }

      currentSceneRef.current = nextScene;

      if (cameraRef.current) {
        cameraRef.current.position.set(0.6, 0.3, 0.1);
        cameraRef.current.updateProjectionMatrix?.();
      }
      if (controlsRef.current) {
        controlsRef.current.enabled = false;
        controlsRef.current.target.set(0, 0, 0);
        controlsRef.current.update();
      }

      const imgUrl = getImageUrl(nextScene, viewMode);

      const nextTexture = await loadTexture(imgUrl).catch(() => null);
      console.log("Loaded texture for", imgUrl, nextTexture);
      if (!nextTexture) {
        if (controlsRef.current) controlsRef.current.enabled = true;
        isTransitioningRef.current = false;
        return;
      }

      const nextMesh =usingMesh1 ? panoMesh2Ref.current : panoMesh1Ref.current;
      const currentMesh =usingMesh1 ? panoMesh1Ref.current : panoMesh2Ref.current;

      nextMesh.material.map = nextTexture;
      nextMesh.material.transparent = true;
      nextMesh.material.opacity = 0;
      nextMesh.material.needsUpdate = true;

      const scene = sceneRef.current;
      const loader = loaderRef.current;
      const clickable = clickableRef.current;

      clickable.forEach((obj) => obj.parent?.remove(obj));
      clickable.length = 0;

      const currentUnit = currentSlug
        ? buildingData.find((b) => b.slug === currentSlug)
        : null;

      if (!isUnitScene && currentUnit && currentUnit.panoramas?.length) {
        currentUnit.panoramas.forEach((panoramaId) => {
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

                const plane = new THREE.Mesh(
                  new THREE.PlaneGeometry(50, 50),
                  mat
                );

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
              () => {}
            );
          });
        });
      }

      if (previousSceneRef.current && isUnitScene && !isBack) {
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

            const plane = new THREE.Mesh(
              new THREE.PlaneGeometry(50, 50),
              mat
            );

            const phi = THREE.MathUtils.degToRad(95);
            const theta = THREE.MathUtils.degToRad(-60);

            plane.position.set(
              65 * Math.sin(phi) * Math.cos(theta),
              65 * Math.cos(phi),
              65 * Math.sin(phi) * Math.sin(theta)
            );

            plane.lookAt(0, 0, 0);

            const aspect =
              plane.material.map.image?.width /
                plane.material.map.image?.height || 1;

            plane.geometry.dispose();
            plane.geometry = new THREE.PlaneGeometry(
              40 * aspect * 0.35,
              40 * 0.35
            );

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
          () => {}
        );
      }

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
                    } catch(e) {
                        console.warn("Error setting color space for SVG texture", e);
                    }

                    const mat = new THREE.MeshBasicMaterial({
                      map: svgTexture,
                      transparent: true,
                      opacity: 1,
                      side: THREE.DoubleSide,
                      depthWrite: false,
                    });

                    const plane = new THREE.Mesh(
                      new THREE.PlaneGeometry(50, 50),
                      mat
                    );

                    const phi = THREE.MathUtils.degToRad(
                      90 - (b.latitude || 0)
                    );
                    const theta = THREE.MathUtils.degToRad(
                      b.longitude || 0
                    );

                    const dist = b.radius || 65;

                    plane.position.set(
                      dist * Math.sin(phi) * Math.cos(theta),
                      dist * Math.cos(phi),
                      dist * Math.sin(phi) * Math.sin(theta)
                    );

                    plane.lookAt(0, 0, 0);
                    plane.rotation.z = THREE.MathUtils.degToRad(
                      b.rotation || 0
                    );

                    const aspect =
                      plane.material.map?.image?.width /
                        plane.material.map?.image?.height || 1;

                    plane.geometry.dispose();
                    plane.geometry = new THREE.PlaneGeometry(
                      (b.size || 50) * aspect,
                      b.size || 50
                    );

                    plane.userData = {
                      type: "building",
                      buildingSlug: b.svg,
                      nextPanorama: b.nextPanorama,
                    };

                    plane.renderOrder = 1;

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

      // Add new hotspots
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
    },

    [
      viewMode,
      panoramas,
      buildingData,
      getImageUrl,
      loadTexture,
      setUsingMesh1,
      setCurrentScene,
    ]
  );

  return switchPanorama;
}
