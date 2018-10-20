// variables for API endpoints for the earthquakes and faultlines respectively
let EQ_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

let FL_URL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";


// Function call to render map
renderMap(EQ_URL, FL_URL);

// Function to render map
function renderMap(EQ_URL, FL_URL) {

  // Performs GET request for the earthquake URL
  d3.json(EQ_URL, function(data) {
    console.log(EQ_URL)
    // Stores response into EQ_Data
    let EQ_Data = data;
    // Performs GET request for the fault lines URL
    d3.json(FL_URL, function(data) {
      // Stores response into faultLineData
      let FL_Data = data;

      // Passes data into createFeatures function
      createFeatures(EQ_Data, FL_Data);
    });
  });

  // Function to create features
  function createFeatures(EQ_Data, FL_Data) {

    // Defines two functions ran once for each feature in EQ_Data
    // Creates markers for each earthquake and adds a popup describing the place, time, and magnitude of each
    function onEachQuakeLayer(feature, layer) {
      return new L.circleMarker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
        fillOpacity: 1,
        color: chooseColor(feature.properties.mag),
        fillColor: chooseColor(feature.properties.mag),
        radius:  markerSize(feature.properties.mag)
      });
    }
    function onEachEarthquake(feature, layer) {
      layer.bindPopup("<h3>" + feature.properties.place + "</h3><hr><p>" + new Date(feature.properties.time) + "</p><hr><p>Magnitude: " + feature.properties.mag + "</p>");
    }

    // Defines a function ran once for each feature in FL_Data to create fault lines
    function onEachFaultLine(feature, layer) {
      L.polyline(feature.geometry.coordinates);
    }

    // Creates a GeoJSON layer containing the features array of the EQ_Data object
    // Run the onEachEarthquake & onEachQuakeLayer functions once for each element in the array
    let EarthQuakes = L.geoJSON(EQ_Data, {
      onEachFeature: onEachEarthquake,
      pointToLayer: onEachQuakeLayer
    });

    // Creates a GeoJSON layer containing the features array of the FL_Data object
    // Run the onEachFaultLine function once for each element in the array
    let FaultLines = L.geoJSON(FL_Data, {
      onEachFeature: onEachFaultLine,
      style: {
        weight: 2,
        color: 'blue'
      }
    });

    // Creates a Timeline layer containing the features array of the EQ_Data object
    // Run getInterval function to get the time interval for each earthquake (length based on magnitude)
    // Run the onEachEarthquake & onEachQuakeLayer functions once for each element in the array
    let timelineLayer = L.timeline(EQ_Data, {
      getInterval: function(feature) {
        return {
          start: feature.properties.time,
          end: feature.properties.time + feature.properties.mag * 10000000
        };
      },
      pointToLayer: onEachQuakeLayer,
      onEachFeature: onEachEarthquake
    });

    // Passes earthquakes, fault lines and timeline layers data to the createMap function
    createMap(EarthQuakes, FaultLines, timelineLayer);
  }

  // Function to create map
  function createMap(EarthQuakes, FaultLines, timelineLayer) {
    // Define outdoors, satellite, and darkmap layers
    // Outdoors layer
    let outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token={accessToken}",
        {
            accessToken: API_KEY
           });
      // Satellite layer
    let satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token={accessToken}",
        {
            accessToken: API_KEY
           });
      // Darkmap layer
    let darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token={accessToken}",
         {
             accessToken: API_KEY
            });
          

    // Define a baseMaps object to hold base layers
    let baseMaps = {
      "Outdoors": outdoors,
      "Satellite": satellite,
      "Dark Map": darkmap,
    };

    // Create overlay object to hold overlay layers
    let overlayMaps = {
      "Earthquakes": EarthQuakes,
      "Fault Lines": FaultLines
    };

    // Create map, default settings: outdoors and faultLines layers display on load
    let map = L.map("map", {
      center: [39.8283, -98.5785],
      zoom: 3,
      layers: [outdoors, FaultLines],
      scrollWheelZoom: false
    });

    // Create a layer control
    // Pass in baseMaps and overlayMaps
    // Add the layer control to the map
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: true
    }).addTo(map);

    // Adds Legend
    let legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
      let div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + chooseColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };
    legend.addTo(map);

    // Adds timeline and timeline controls
    let timelineControl = L.timelineSliderControl({
      formatOutput: function(date) {
        return new Date(date).toString();
      }
    });
    timelineControl.addTo(map);
    timelineControl.addTimelines(timelineLayer);
    timelineLayer.addTo(map);
  }
}

// chooseColor function:
// Returns color for each grade parameter using ternary expressions
function chooseColor(magnitude) {
  return magnitude > 5 ? "red":
    magnitude > 4 ? "orange":
      magnitude > 3 ? "gold":
        magnitude > 2 ? "yellow":
          magnitude > 1 ? "yellowgreen":
            "greenyellow"; // <= 1 default
}

// Function to amplify circle size by earthquake magnitude
function markerSize(magnitude) {
  return magnitude * 5;
}
