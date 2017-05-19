function getPageData(searchTerm, pageNum) {
	// Create new promise for AJAX request
	return new Promise(resolve => {
		retrieveData(searchTerm, pageNum, resolve);
	});
}

function retrieveData(query, page, func) {
	// Create AJAX request and call callback function on results if successful
	var xhr = new XMLHttpRequest();
	xhr.open('GET', `http://www.omdbapi.com/?s=${query}&page=${page}`);
	xhr.send();

	xhr.onreadystatechange = function() {
		if(xhr.readyState === 4 && xhr.status === 200) {
		    func(xhr.responseText);
		}
	}
}

function addPopup(e) {
	// Create AJAX request for detail modal view
	var xhr = new XMLHttpRequest();

	xhr.onreadystatechange = function() {
		if(xhr.readyState === 4 && xhr.status === 200) {
			var data = JSON.parse(xhr.responseText)
			// Add updated data to the modal
			document.getElementById('modalTitle').innerHTML = data.Title;
			document.getElementById('detailPlot').innerHTML = data.Plot;
			document.getElementById('detailActors').innerHTML = data.Actors;
			document.getElementById('detailGenre').innerHTML = data.Genre;
		}
	}

	// Execute the AJAX request
	xhr.open('GET', `http://www.omdbapi.com/?i=${this.id}`);
	xhr.send();

	$("#detailView").modal()
}

function sendData(data) {
	// Send post request to the server with JSON data attached
	var xhr = new XMLHttpRequest();
	xhr.open('POST', '/favorites');
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.send(JSON.stringify({name: data.Title, oid: data.imdbID}));
}

function favorite(e) {
	// Don't add to favorites if already selected
	if(this.classList.contains('selected')) return;
	this.classList += ' selected';

	var movieData = JSON.parse(this.dataset.movie);
	sendData(movieData);
}


function createTable(data) {
	// Access current table div and clear it
	var tableDiv = document.getElementById('data_table')
	tableDiv.innerHTML = ""

	// Create a table, a table header, and a table body
	var table = document.createElement('table');
	var tableHeader = document.createElement('thead');
	var tableBody = document.createElement('tbody');

	// Create the header row
	var tRow = tableHeader.insertRow();
	var thTitle = tRow.insertCell();
	thTitle.innerHTML = 'Title';
	var thYear = tRow.insertCell();
	thYear.innerHTML = 'Year';
	var thType = tRow.insertCell();
	thType.innerHTML = 'Type';
	var thFave = tRow.insertCell();
	thFave.innerHTML = 'Favorite';

	// Iterate through each row of the data and add a table row for it
	data.forEach((row) => {
		var tRow = table.insertRow();
		var tdTitle = tRow.insertCell();

		// Add title modal trigger
		tdTitle.innerHTML = row.Title;
		tdTitle.id = row.imdbID;
		tdTitle.addEventListener('click', addPopup);
		tdTitle.className += 'text-info hoverPointer';

		var tdYear = tRow.insertCell();
		tdYear.innerHTML = row.Year;
		var tdType = tRow.insertCell();
		tdType.innerHTML = row.Type;

		// Add favorite button
		var tdFave = tRow.insertCell();
		tdFave.className += 'text-center favorite hoverPointer';
		tdFave.innerHTML = '<span class="glyphicon glyphicon-star" aria-hidden="true"></span>';
		tdFave.addEventListener('click', favorite);
		tdFave.setAttribute('data-movie', JSON.stringify(row));

		tableBody.appendChild(tRow);
	})

	// add the header and body to the table
	table.appendChild(tableHeader);
	table.appendChild(tableBody);

	// add Bootstrap class to prettify table
	table.className +='table';
	tableDiv.appendChild(table);
}

function getAllPageData(searchTerm, pageCount) {
	// Create an AJAX request for each of the pages of API data
	var promises = [];
	for(pageNum = 1; pageNum <= pageCount; pageNum++) {
		promises.push(getPageData(searchTerm, pageNum));
	}

	// Once each AJAX call has executed, parse all of the results,
	// then create the table containing them 
	Promise.all(promises).then(results => {
		var movieData = [];

		results.forEach((result) => {
			movieData = movieData.concat(JSON.parse(result).Search);
		});

		createTable(movieData);
	})
}

function searchSubmit() {
	var searchTerm = document.getElementById('searchTerm').value;

	// Retrieve data from API and then find how many pages of results there will be
	getPageData(searchTerm, 1).then(pageData => {
		pageData = JSON.parse(pageData);
		var resultsCount = parseInt(pageData.totalResults);
		return resultsCount;
	}).then(resultsCount => {
		var pageCount = Math.ceil(resultsCount/10);
		getAllPageData(searchTerm, pageCount);
	});
}

// Add event listeners so that pressing the search submit button executes the search
// and so does pressing the enter key
document.getElementById('searchSubmit').addEventListener('click', searchSubmit);
document.getElementById('searchTerm').addEventListener('keyup', (e) => {
	if (e.keyCode == 13){ // the key code for the enter key is 13
		searchSubmit(e);
	}
})