import React from 'react';
import PanoramaViewer from './components/PanoramaViewer';

const panoramas = [
  {
    id: 'scene1',
    images:[
        {
            key:'panorama-1',
            image: '/assets/7-7.0001.webp',
            svg:'/assets/svg/units.svg',
            controls:{
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
            }

        },
        {
            key:'panorama-2',
            image: '/assets/7-7.0001_mirrored.webp',
            svg:'/assets/svg/units_mir.svg',
            controls:{
                latitude: 113.4,
                longitude: 68.1,
                radius: 601,
                scale: 0.66,
                offsetX: -160,
                offsetY: -605.5,
                offsetZ: 284.5,
                yaw: -4.399999,
                pitch: -11,
                roll: -0.89999,
                opacity: 0.37,
            }
        }
    ],
    buildings: [
    
        {
            id: "house0",
            svg: "b_847D73",
            nextPanorama: "scene5"
        },
        {
            id: "house1",
            svg: "b_778B5F",
            nextPanorama: "scene5"
        },
        {
            id: "house2",
            svg: "b_465B3B",
            nextPanorama: "scene5"
        },
        {
            id: "house3",
            svg: "b_936878",
            nextPanorama: "scene5"
        },
        {
            id: "house4",
            svg: "b_601728",
            nextPanorama: "scene5"
        },
        {
            id: "house5",
            svg: "b_353C67",
            nextPanorama: "scene5"
        },
        {
            id: "house6",
            svg: "b_266F8C",
            nextPanorama: "scene5"
        },
        {
            id: "house7",
            svg: "b_7C8951",
            nextPanorama: "scene5"
        },
        {
            id: "house8",
            svg: "b_16406E",
            nextPanorama: "scene5"
        },
        {
            id: "house9",
            svg: "b_67406D",
            nextPanorama: "scene5"
        },
        {
            id: "house10",
            svg: "b_739594",
            nextPanorama: "scene5"
        },
        {
            id: "house11",
            svg: "b_396365",
            nextPanorama: "scene5"
        },
        {
            id: "house12",
            svg: "b_836A7D",
            nextPanorama: "scene5"
        },
        {
            id: "house13",
            svg: "b_4A7C6F",
            nextPanorama: "scene5"
        },
        {
            id: "house14",
            svg: "b_87518B",
            nextPanorama: "scene5"
        },
        {
            id: "house15",
            svg: "b_636F8C",
            nextPanorama: "scene5"
        },
        {
            id: "house16",
            svg: "b_789288",
            nextPanorama: "scene5"
        },
        {
            id: "house17",
            svg: "b_87508A",
            nextPanorama: "scene5"
        },
        {
            id: "house18",
            svg: "b_835A39",
            nextPanorama: "scene5"
        },
        {
            id: "house19",
            svg: "b_668D6C",
            nextPanorama: "scene5"
        },
        {
            id: "house20",
            svg: "b_8F4F88",
            nextPanorama: "scene5"
        },
        {
            id: "house21",
            svg: "b_6E4D83",
            nextPanorama: "scene5"
        },
        {
            id: "house22",
            svg: "b_8E0C16",
            nextPanorama: "scene5"
        },
        {
            id: "house23",
            svg: "b_875A3A",
            nextPanorama: "scene5"
        },
        {
            id: "house24",
            svg: "b_685591",
            nextPanorama: "scene5"
        },
        {
            id: "house25",
            svg: "b_718182",
            nextPanorama: "scene5"
        },
        {
            id: "house26",
            svg: "b_5A5E4F",
            nextPanorama: "scene5"
        },
        {
            id: "house27",
            svg: "b_8A9181",
            nextPanorama: "scene5"
        },
        {
            id: "house28",
            svg: "b_8D7F7C",
            nextPanorama: "scene5"
        },
        {
            id: "house29",
            svg: "b_579285",
            nextPanorama: "scene5"
        },
        {
            id: "house30",
            svg: "b_898B5C",
            nextPanorama: "scene5"
        },
        {
            id: "house31",
            svg: "b_90764B",
            nextPanorama: "scene5"
        },
        {
            id: "house32",
            svg: "b_496F8C",
            nextPanorama: "scene5"
        },
        {
            id: "house33",
            svg: "b_8E938D",
            nextPanorama: "scene5"
        },
        {
            id: "house34",
            svg: "b_8E9592",
            nextPanorama: "scene5"
        },
        {
            id: "house35",
            svg: "b_81907A",
            nextPanorama: "scene5"
        },
        {
            id: "house36",
            svg: "b_8F5A33",
            nextPanorama: "scene5"
        },
        {
            id: "house37",
            svg: "b_504E85",
            nextPanorama: "scene5"
        },
        {
            id: "house38",
            svg: "b_1F5A33",
            nextPanorama: "scene5"
        },
        {
            id: "house39",
            svg: "b_729592",
            nextPanorama: "scene5"
        },
        {
            id: "house40",
            svg: "b_95917F",
            nextPanorama: "scene5"
        },
        {
            id: "house41",
            svg: "b_745795",
            nextPanorama: "scene5"
        },
        {
            id: "house42",
            svg: "b_906C85",
            nextPanorama: "scene5"
        },
        {
            id: "house43",
            svg: "b_3F838B",
            nextPanorama: "scene4"
        },
        {
            id: "house44",
            svg: "b_807B6A",
            nextPanorama: "scene4"
        },
        {
            id: "house45",
            svg: "b_767A64",
            nextPanorama: "scene4"
        },
        {
            id: "house46",
            svg: "b_684A7E",
            nextPanorama: "scene4"
        },
        {
            id: "house47",
            svg: "b_636D85",
            nextPanorama: "scene4"
        },
        {
            id: "house48",
            svg: "b_898B5F",
            nextPanorama: "scene4"
        },
        {
            id: "house49",
            svg: "b_454B81",
            nextPanorama: "scene4"
        },
        {
            id: "house50",
            svg: "b_3E7C70",
            nextPanorama: "scene4"
        },
        {
            id: "house51",
            svg: "b_6D9591",
            nextPanorama: "scene4"
        },
        {
            id: "house52",
            svg: "b_7B7544",
            nextPanorama: "scene4"
        },
        {
            id: "house53",
            svg: "b_601220",
            nextPanorama: "scene4"
        },
        {
            id: "house54",
            svg: "b_958695",
            nextPanorama: "scene4"
        },
        {
            id: "house55",
            svg: "b_54795F",
            nextPanorama: "scene4"
        },
        {
            id: "house56",
            svg: "b_745929",
            nextPanorama: "scene4"
        },
        {
            id: "house57",
            svg: "b_835B3C",
            nextPanorama: "scene4"
        },
        {
            id: "house58",
            svg: "b_717E78",
            nextPanorama: "scene4"
        },
        {
            id: "house59",
            svg: "b_658844",
            nextPanorama: "scene4"
        },
        {
            id: "house60",
            svg: "b_3C732B",
            nextPanorama: "scene4"
        },
        {
            id: "house61",
            svg: "b_267191",
            nextPanorama: "scene4"
        },
        {
            id: "house62",
            svg: "b_8F538D",
            nextPanorama: "scene4"
        },
        {
            id: "house63",
            svg: "b_8C7293",
            nextPanorama: "scene4"
        },
        {
            id: "house64",
            svg: "b_907437",
            nextPanorama: "scene4"
        },
        {
            id: "house65",
            svg: "b_8C6D87",
            nextPanorama: "scene4"
        },
        {
            id: "house66",
            svg: "b_658695",
            nextPanorama: "scene4"
        },
        {
            id: "house67",
            svg: "b_718613",
            nextPanorama: "scene4"
        },
        {
            id: "house68",
            svg: "b_887755",
            nextPanorama: "scene4"
        },
        {
            id: "house69",
            svg: "b_4F2E4F",
            nextPanorama: "scene4"
        },
        {
            id: "house70",
            svg: "b_7E4678",
            nextPanorama: "scene4"
        },
        {
            id: "house71",
            svg: "b_707B6B",
            nextPanorama: "scene4"
        },
        {
            id: "house72",
            svg: "b_602540",
            nextPanorama: "scene4"
        },
        {
            id: "house73",
            svg: "b_3F8491",
            nextPanorama: "scene4"
        }

    ],
    amenities: [
      {
        id: "beach",
       name: "Piza Hut",
        location: "-12.2, 24.1",
       category: "Restaurants"
      },
      {
        id: "resort",
       name: "Theta Mediterranean restaurant",
        location: "-15.7, -0.199999999999989",
       category: "beach"
      },
      {
        id: "head",
       name: "Nero caffe Macenzie beach",
        location: "-13.9, -142.2",
       category: "shopping"
      },
      {
        id: "resort",
       name: "Jackson Gastro Cafe Bar",
        location: "-31.3, -173.4",
        category: "transport"
      },

    ]

  },
  {
    id: 'panorama-1',
    image: '/assets/7-1.0001.webp',
    hotspots: [
          {
        "image": "panorama-2",
        "latitude": -3.89999999999998,
        "longitude": 96.1
        },
        {
            "image": "scene4",
            "latitude": -174.8,
            "longitude": -0.0999999999999943
        }
    ],
  },
   {
    id: 'panorama-2',
    image: '/assets/7-4.0001.webp',
       hotspots: [
          {
        "image": "panorama-2",
        "latitude": -3.89999999999998,
        "longitude": 96.1
        },
        {
        "image": "scene4",
        "latitude": -174.8,
        "longitude": -0.0999999999999943
        }
    ],
  },
    {
    id: 'scene4',
    image: '/assets/7-6.0000.webp',
    buildings: [],
  },
    {
    id: 'scene5',
    image: '/assets/7-5.0001.webp',
    buildings: [],
  },
    {
    id: 'beach',
    image: '/assets/beach.jpg',
    buildings: [],
  },
    {
    id: 'resort',
    image: '/assets/resort.jpg',
    buildings: [],
  },
    {
    id: 'head',
    image: '/assets/head.jpg',
    buildings: [],
  },
];

export default function App() {
  return (
    <div className="h-screen bg-gray-900">
      <PanoramaViewer panoramas={panoramas} />
    </div>
  );
}
