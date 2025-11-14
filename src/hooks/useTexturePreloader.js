
import { useEffect, useState, useRef } from "react";
import * as THREE from "three";

export function useTexturePreloader(panoramas) {
  const [isReady, setIsReady] = useState(false);
  const textureCache = useRef({});

  useEffect(() => {
    let mounted = true;
    const loader = new THREE.TextureLoader();

    const allImages = panoramas.flatMap((p) =>
      Array.isArray(p.images) ? p.images.map((img) => img.image) : [p.image]
    );

    const loadPromises = allImages.map(
      (imgPath) =>
        new Promise((resolve) => {
          if (textureCache.current[imgPath]) return resolve();
          loader.load(
            imgPath,
            (tex) => {
              tex.colorSpace = THREE.SRGBColorSpace;
              tex.minFilter = THREE.LinearMipmapLinearFilter;
              tex.generateMipmaps = true;
              textureCache.current[imgPath] = tex;
              resolve();
            },
            undefined,
            () => resolve()
          );
        })
    );

    Promise.all(loadPromises).then(() => mounted && setIsReady(true));

    return () => (mounted = false);
  }, [panoramas]);

  return { isReady, textureCache };
}
