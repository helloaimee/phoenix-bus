mapboxgl.accessToken =
  "pk.eyJ1IjoiaGVsbG9haW1lZSIsImEiOiJjbDFlbWp5OW8wb24yM3FuczVneGFyOGsyIn0.VMTAWac5UxlFWvPrQPbr6w";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/mapbox/streets-v11",
  center: [-112.00265, 33.4677],
  zoom: 10,
});

const busMarkers = {};

window.busMarkers = busMarkers;

function getTripIdByRouteId({ data, routeId }) {
  const trip = data.find(
    (singleTrip) => singleTrip?.tripUpdate?.trip?.routeId == routeId
  );

  if (trip) {
    return trip.tripUpdate.trip.tripId;
  }

  return null;
}

function getVehicleByTripId({ data, tripId }) {
  console.log("im big data", data);
  const vehicle = data.find(
    (singleVehicle) => singleVehicle?.vehicle?.trip?.tripId === tripId
  );

  if (vehicle) {
    return vehicle.vehicle;
  }

  return null;
}

async function getDataFromUrl(url) {
  const response = await fetch(url);
  const json = await response.json();
  return json;
}

async function getVehicleLocations() {
  const data = await getDataFromUrl(
    "https://app.mecatran.com/utw/ws/gtfsfeed/vehicles/valleymetro?apiKey=4f22263f69671d7f49726c3011333e527368211f&asJson=true"
  );

  return data.entity;
}

const colorScale = chroma?.scale(["red", "orange", "yellow", "green"]);

function setMarkerColor({ marker, speed, maxSpeed }) {
  const speedRatio = speed / maxSpeed;
  const color = colorScale(speedRatio).toString();

  let markerElement = marker.getElement();
  markerElement.querySelectorAll("path")[0].setAttribute("fill", color);
  markerElement.querySelectorAll("path")[0].setAttribute("speed", speed);
  marker._color = color;
}

async function run() {
  const busData = await getVehicleLocations();

  let maxSpeed = 0;

  busData.forEach(({ vehicle }) => {
    if (vehicle.position.speed > maxSpeed) {
      maxSpeed = vehicle.position.speed;
    }
  });

  busData.forEach((bus) => {
    if (busMarkers[bus.id]) {
      busMarkers[bus.id].setLngLat([
        bus.vehicle.position.longitude,
        bus.vehicle.position.latitude,
      ]);
    } else {
      busMarkers[bus.id] = new mapboxgl.Marker()
        .setLngLat([
          bus.vehicle.position.longitude,
          bus.vehicle.position.latitude,
        ])
        .addTo(map);
    }
    setMarkerColor({
      marker: busMarkers[bus.id],
      speed: bus.vehicle.position.speed ?? 0,
      maxSpeed,
    });
  });
  setTimeout(run, 5000);
}

run();
