
  export const getImageUrl = (scene, viewMode) => {
    if (!scene) return null;

    if (Array.isArray(scene.images)) {
      const matched = scene.images.find((img) => img.key === viewMode);
      if (matched) return matched.image;
    }

    return scene.image || null;
  };