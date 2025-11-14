import { useCallback } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

export function useHotspotBuilder({
  panoramas,
  viewMode,
  sceneRef,
  clickableRef,
}) {
  const buildHotspots = useCallback(
    async (sceneData, unitsData = []) => {
      const scene = sceneRef.current;
      const clickable = clickableRef.current;
      const svgLoader = new SVGLoader();

      clickable.forEach((obj) => scene.remove(obj));
      clickable.length = 0;

      const svgPath = panoramas[0].images?.find(
        (i) => i.key === viewMode
      )?.svg;

      const svgData = await new Promise((resolve, reject) => {
        svgLoader.load(svgPath, resolve, undefined, reject);
      });

      const pathsById = {};
      svgData.paths.forEach((p) => {
        const id = p.userData?.node?.id;
        if (id) pathsById[id] = p;
      });

      const controls = panoramas[0].images?.find(
        (i) => i.key === viewMode
      )?.controls;

      const oldGroup = scene.getObjectByName("hotspot-group");
      if (oldGroup) {
        scene.remove(oldGroup);
        oldGroup.traverse((child) => {
          child.geometry?.dispose();
          child.material?.dispose();
        });
      }

      const group = new THREE.Group();
      group.name = "hotspot-group";
      scene.add(group);

      const rebuildMeshes = () => {
        while (group.children.length > 0) group.remove(group.children[0]);
        clickable.length = 0;

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

        sceneData.buildings.forEach((b) => {
          const unit = unitsData.find((u) => u.slug === b.svg);
          if (!unit) return;
          if (!unit.panoramas?.includes(viewMode)) return;

          let fillColor = "#cccccc";

          if ((unit.status === 1 || unit.status === 2) &&unit.building_type.slug === "type_b")fillColor = "#FFEB3B";
          else if ( (unit.status === 1 || unit.status === 2) &&unit.building_type.slug === "type_a")fillColor = "#2196F3";     
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
            const [lat, lng] = amenity.location
              .split(",")
              .map((v) => parseFloat(v.trim()));

            if (isNaN(lat) || isNaN(lng)) return;

            const phiA = THREE.MathUtils.degToRad(90 - lat);
            const thetaA = THREE.MathUtils.degToRad(lng + 180);

            const x = RADIUS * Math.sin(phiA) * Math.cos(thetaA);
            const y = RADIUS * Math.cos(phiA);
            const z = RADIUS * Math.sin(phiA) * Math.sin(thetaA);

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

      rebuildMeshes();
    },
    [viewMode, panoramas]
  );

  return buildHotspots;
}
