console.log('Routing calculation loaded');

var poiLocations = BSX_POIs_JSON.locations;

// to filter POIs based on keyword
function filterPOIs(keyword) {
    return poiLocations.filter(function(location) {
        return location.name.toLowerCase().includes(keyword.toLowerCase());
    });
}

// to get coordinates of POIs by name
function getPOICoordinates(poiName) {
    var poi = poiLocations.find(function(location) {
        return location.name.toLowerCase() === poiName.toLowerCase();
    });

    if (poi) {
        return {
            lat: poi.lat,
            lon: poi.lon,
            name: poi.name
        };
    } else {
        console.error('POI not found:', poiName);
        return null;
    }
}

// to prepare locations array for Valhalla API request
function prepareLocations(originName, destinationName) {
    var origin = getPOICoordinates(originName);
    var destination = getPOICoordinates(destinationName);

    if (origin && destination) {
        return [origin, destination];
    } else {
        console.error('Invalid origin or destination');
        return null;
    }
}

// Function to find the nearest entrance between origin and destination POIs
function findNearestEntrance(poiName, entrances) {
    let poi = BSX_POIs_JSON.locations.find(poi => poi.name === poiName);
    if (!poi) {
        console.error('POI not found:', poiName);
        return null;
    }

    let nearestEntrance = null;
    let shortestDistance = Infinity;

    entrances[poiName].forEach(entrance => {
        // Calculate distance between POI and entrance
        const distance = calculateDistance(poi.lat, poi.lon, entrance.lat, entrance.lon);
        
        // Update nearest entrance if distance is shorter
        if (distance < shortestDistance) {
            nearestEntrance = entrance;
            shortestDistance = distance;
        }
    });

    console.log('Nearest entrance for', poiName, 'is', nearestEntrance);
    return nearestEntrance;
}

// Function to find the pair of entrance coordinates with the shortest distance between them
function findShortestDistance(originEntrances, destinationEntrances) {
    let shortestDistance = Infinity;
    let nearestEntrancePair = {};

    originEntrances.forEach(originEntrance => {
        destinationEntrances.forEach(destinationEntrance => {
            const distance = calculateDistance(originEntrance.lat, originEntrance.lon, destinationEntrance.lat, destinationEntrance.lon);
            if (distance < shortestDistance) {
                shortestDistance = distance;
                nearestEntrancePair.origin = originEntrance;
                nearestEntrancePair.destination = destinationEntrance;
            }
        });
    });

    return nearestEntrancePair;
}

// Event listener for getdirection-button click
document.getElementById('getdirection-button').addEventListener('click', async function() {
    var originName = document.getElementById('origin-input').value;
    var destinationName = document.getElementById('destination-input').value;

    // Get list of entrance coordinates for origin and destination POIs
    var originEntrances = entrances[originName];
    var destinationEntrances = entrances[destinationName];

    if (originEntrances && destinationEntrances) {
        // Find the pair of entrance coordinates with the shortest distance between them
        var nearestEntrancePair = findShortestDistance(originEntrances, destinationEntrances);
        console.log('Nearest entrance pair:', nearestEntrancePair);

        // Pass the coordinates of originEntrance and destinationEntrance to your API
        if (nearestEntrancePair.origin && nearestEntrancePair.destination) {
            var requestData = {
                locations: [nearestEntrancePair.origin, nearestEntrancePair.destination],
                costing: 'pedestrian', // Specify the costing type for pedestrian routing
                costing_options: {
                    pedestrian: {
                        // Adjust costing options for pedestrian routing, such as favoring sidewalks
                        sidewalk_factor: 1.0 // Example: prioritize sidewalks
                    }
                }
            };

            try {
                var apiUrl = 'https://interline-global-valhalla-navigation-and-routing-engine.p.rapidapi.com/route';
                var apiKey = '9f75e5b0c5msh7d0948e8906bcf9p1f4b0cjsn3b4b4bbdf497';
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Key': apiKey,
                        'X-RapidAPI-Host': 'interline-global-valhalla-navigation-and-routing-engine.p.rapidapi.com'
                    },
                    body: JSON.stringify(requestData)
                });
                const data = await response.json();

                console.log('Response from Valhalla API:', data);
                displayRoute(data);
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        } else {
            console.error('Unable to find nearest entrances for origin and/or destination POIs');
        }
    } else {
        console.error('Invalid origin or destination POI name');
    }
});

// Function to calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}


// Event listener for filtering suggestion for origin
document.getElementById('origin-input').addEventListener('input', function() {
    var inputText = this.value.toLowerCase();
    var suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';

    var filteredPOIs = filterPOIs(inputText);

    // sort
    filteredPOIs.sort(function(a, b) {
        // check if name starts with input text
        var startsWithInputA = a.name.toLowerCase().startsWith(inputText);
        var startsWithInputB = b.name.toLowerCase().startsWith(inputText);

        // sort alphabetically
        if ((startsWithInputA && startsWithInputB) || (!startsWithInputA && !startsWithInputB)) {
            return a.name.localeCompare(b.name);
        } else if (startsWithInputA) {
            return -1; // letter a before b
        } else {
            return 1; 
        }
    });

    filteredPOIs.forEach(function(location) {
        var listItem = document.createElement('li');
        listItem.textContent = location.name;
        listItem.addEventListener('click', function() {
            document.getElementById('origin-input').value = location.name;
            suggestionsList.innerHTML = '';
        });
        suggestionsList.appendChild(listItem);
    });
});

// Event listener for destination input
document.getElementById('destination-input').addEventListener('input', function() {
    var inputText = this.value.toLowerCase();
    var suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';

    var filteredPOIs = filterPOIs(inputText);

    // sort based on input
    filteredPOIs.sort(function(a, b) {
        // check if name starts with input text
        var startsWithInputA = a.name.toLowerCase().startsWith(inputText);
        var startsWithInputB = b.name.toLowerCase().startsWith(inputText);

        // sort alphabetically
        if ((startsWithInputA && startsWithInputB) || (!startsWithInputA && !startsWithInputB)) {
            return a.name.localeCompare(b.name);
        } else if (startsWithInputA) {
            return -1; // a before b
        } else {
            return 1; 
        }
    });

    filteredPOIs.forEach(function(location) {
        var listItem = document.createElement('li');
        listItem.textContent = location.name;
        listItem.addEventListener('click', function() {
            document.getElementById('destination-input').value = location.name;
            suggestionsList.innerHTML = '';
        });
        suggestionsList.appendChild(listItem);
    });
});

document.addEventListener('click', function(event) {
    var originInput = document.getElementById('origin-input');
    var destinationInput = document.getElementById('destination-input');
    var suggestionsList = document.getElementById('suggestions');

    if (event.target !== originInput && event.target !== destinationInput && event.target.parentNode !== suggestionsList) {
        suggestionsList.innerHTML = '';
    }
});