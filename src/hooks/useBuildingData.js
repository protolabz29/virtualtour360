// useBuildingData.js
import { useEffect, useState } from "react";

export function useBuildingData() {
  const [buildingData, setBuildingData] = useState([]);

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
      .catch(() => mounted && setBuildingData([]));

    return () => (mounted = false);
  }, []);

  return buildingData;
}
