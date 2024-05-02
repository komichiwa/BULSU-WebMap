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
    }
});

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