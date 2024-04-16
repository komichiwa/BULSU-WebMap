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

// Event listener for getdirection-button click
document.getElementById('getdirection-button').addEventListener('click', async function() {
    var originName = document.getElementById('origin-input').value;
    var destinationName = document.getElementById('destination-input').value;

    var locations = prepareLocations(originName, destinationName);
    if (locations) {
        var requestData = {
            locations: locations,
            costing: 'pedestrian',
            costing_options: {
                pedestrian: {
                    // Adjust walking speed if necessary
                    walking_speed: 5.0,
                    // Maximum turn penalty in seconds
                    max_turn_penalty: 60.0,
                    // Maximum walking distance in meters
                    max_walk_distance: 10000.0,
                    // Maximum walking time in seconds
                    max_walk_time: 1800.0,
                    // Adjust penalization for covered pathways
                    covered_penalty: 0.5 // Lower penalty for covered pathways
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
    }
});

// Event listener for filtering suggestion for origin
document.getElementById('origin-input').addEventListener('input', function() {
    var inputText = this.value.toLowerCase();
    var suggestionsList = document.getElementById('suggestions');
    suggestionsList.innerHTML = '';

    var filteredPOIs = filterPOIs(inputText);

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
