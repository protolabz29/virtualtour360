import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useTexturePreloader } from "../hooks/useTexturePreloader";
import { useBuildingData } from "../hooks/useBuildingData";
import { useHotspotBuilder } from "../hooks/useHotspotBuilder";
import { getImageUrl } from "../helper/getImageURL";
import { usePanoramaSwitcher } from "../hooks/usePanoramaSwitcher";
import { usePanoramaEngine } from "../hooks/usePanoramaEngine";
import LoadingScreen from "./LoadingScreen";
import Dropdown from "./Dropdown";
import Button from "./Button";

export default function PanoramaViewer({ panoramas }) {
  const containerRef = useRef(null);
  const { isReady, textureCache } = useTexturePreloader(panoramas);
  const buildingData = useBuildingData();
  const [currentScene, setCurrentScene] = useState(panoramas[0]);
  const [history, setHistory] = useState([]);
  const [viewMode, setViewMode] = useState(panoramas[0].images[0].key);

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const clickableRef = useRef([]);

  const previousSceneRef = useRef(null);
  const currentSceneRef = useRef(null);

  const panoMesh1Ref = useRef(null);
  const panoMesh2Ref = useRef(null);

  const isTransitioningRef = useRef(false);
  const loaderRef = useRef(new THREE.TextureLoader());

  const [usingMesh1, setUsingMesh1] = useState(true);

  const autorotateTimeoutRef = useRef(null);
  const autorotateSpeed = 0.3;

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
          reject
        );
      }
    });

  const buildHotspots = useHotspotBuilder({
    panoramas,
    viewMode,
    sceneRef,
    clickableRef,
  });

  const switchPanorama = usePanoramaSwitcher({
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
  });

  usePanoramaEngine({
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
  });

  useEffect(() => {
    if (!isReady) return;
    const update = async () => {
      await switchPanorama(panoramas[0], null);
      await buildHotspots(panoramas[0], buildingData);
      setHistory([]);
    };
    update();
  }, [viewMode]);

  const goBack = async () => {
    if (history.length === 0) return;

    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));

    await switchPanorama(prev, prev.slug || null);
    await buildHotspots(prev, buildingData);
  };

  if (!isReady) {
    return <LoadingScreen />;
  }
  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ background: "black" }}
      />

      <Dropdown
        viewMode={viewMode}
        panoramas={panoramas}
        onChange={(mode) => setViewMode(mode)}
      />

      {history.length > 0 && <Button onClick={goBack} text="← Back" />}
    </div>
  );
}
