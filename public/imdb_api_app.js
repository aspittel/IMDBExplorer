'use strict';

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

class MovieTableRow extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			favorited: false
		};
	}

	addFavorite(e) {
		if(this.state.favorited) return;

		this.setState({
			favorited: true
		});

		// Send request to the server to save the favorited row
		var xhr = new XMLHttpRequest();
		xhr.open('POST', '/favorites');
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.send(JSON.stringify({name: this.props.title, oid: this.props.imdbID}));
	}

	addPopup(e) {
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
		xhr.open('GET', `http://www.omdbapi.com/?i=${this.props.imdbID}`);
		xhr.send();

		$("#detailView").modal()
	}

	render() {
		const {title, year, type, imdbID} = this.props;
		let favoritedClass = this.state.favorited ? 'glyphicon glyphicon-star selected' : 'glyphicon glyphicon-star';
		return (
			<tr>
				<td className='text-info hoverPointer' onClick={this.addPopup.bind(this)}>{title}</td>
				<td>{year}</td>
				<td>{type}</td>
				<td>
					<span 
						className={favoritedClass}
						aria-hidden="true" 
						onClick={this.addFavorite.bind(this)}>
					</span>
				</td>
			</tr>
		)
	}
}

class MovieTable extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showTable: false,
			searchTerm: '',
		};
	}

	render() {
		const { data } = this.props;
		const rows = data.map((movie) => {
			// Use ES6 features to set variables equal to JSON key names
			let {Title, Year, Type, imdbID} = movie;
			return <MovieTableRow key={imdbID} imdbID={imdbID} title={Title} year={Year} type={Type}/>
		})
		return(
			<table className='table'>
				<thead>
					<tr>
						<th>Title</th>
						<th>Year</th>
						<th>Type</th>
						<th>Favorite</th>
					</tr>
				</thead>
				<tbody>
					{rows}
				</tbody>
			</table>
		);
	}
}

class MovieSearch extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			showTable: false,
			searchTerm: '',
			data: []
		};
	}

	searchSubmit() {
		this.setState({
			showTable: true
		})

		// Retrieve data from API and then find how many pages of results there will be
		getPageData(this.state.searchTerm, 1).then(pageData => {
			pageData = JSON.parse(pageData);
			var resultsCount = parseInt(pageData.totalResults);
			return resultsCount;
		}).then(resultsCount => {
			var pageCount = Math.ceil(resultsCount/10);

			var promises = [];
			for(var pageNum = 1; pageNum <= pageCount; pageNum++) {
				promises.push(getPageData(this.state.searchTerm, pageNum));
			}

			// Once each AJAX call has executed, parse all of the results,
			// then create the table containing them 
			Promise.all(promises).then(results => {
				var movieData = [];

				results.forEach((result) => {
					movieData = movieData.concat(JSON.parse(result).Search);
				});
				
				this.setState({
					data: movieData
				});
			})
		});

	}

	searchChange(e) {
		this.setState({
			searchTerm: e.target.value
		});
	}

	render() {
		return (
			<div>
	    		<div className="form-group">
					<label htmlFor="searchTerm">Movie Search Term</label>
					<input type="text" 
						   className="form-control" 
						   id="searchTerm" 
						   value={this.state.search} 
						   onChange={this.searchChange.bind(this)}
						   placeholder="Star Wars"
					/>
				</div>
				<button type="submit" className="btn btn-primary" onClick={this.searchSubmit.bind(this)}>Search</button>
				{this.state.showTable ? <MovieTable data={this.state.data}/> : null}
			</div>
		)
	}
}

const element = <MovieSearch />

ReactDOM.render(
  element,
  document.getElementById('root')
);
