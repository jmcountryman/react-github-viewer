var RepoBox = React.createClass({
    render: function() {
        return (
            <div className="form-group">
                <label htmlFor="repoInput">User/Repository</label>
                <input id="repoInput" type="text" className="form-control" placeholder="facebook/react" onChange={this.props.onChange} value={this.props.value} />
            </div>
        );
    }
});

var BranchSelector = React.createClass({
  render: function() {
    var branchesArr = [];
    for(var i = 0; i < this.props.branches.length; i++)
        branchesArr.push(<option key={this.props.branches[i].name} value={this.props.branches[i].name}>{this.props.branches[i].name}</option>);

    return (
        <div className="form-group">
            <label htmlFor="branchSelector">Branch</label>
            <select id="branchSelector" className="form-control" value={this.props.value} onChange={this.props.onChange}>
                {branchesArr}
            </select>
        </div>
    );
  }
});

var APIStatusComponent = React.createClass({
    render: function() {
        var timeStr = new Date(this.props.resetTime).toLocaleTimeString();
    
        return <p className="small">API calls remaining: {this.props.remaining} (resets at {timeStr})</p>;
    }
});

var Commit = React.createClass({
    render: function() {
        return <li>{this.props.commit.commit.message}</li>;
    }
});

var CommitList = React.createClass({
    render: function() {
        var commitsArr = [];
        for(var i = 0; i < this.props.commits.length; i++)
            commitsArr.push(<Commit commit={this.props.commits[i]} key={this.props.commits[i].sha} />);

        return (
            <ul>
                {commitsArr}
            </ul>
        );
    }
});

var CommitsComponent = React.createClass({
    render: function() {
        return (
            <div>
                <RepoBox id="repoBox" onChange={this.repoChange} value={this.state.repo} />
                <BranchSelector onChange={this.branchChange} branches={this.state.branches} value={this.state.branch}/>
                <APIStatusComponent remaining={this.state.apiRemaining} resetTime={this.state.apiReset} />
                <CommitList commits={this.state.commits} />
            </div>
        );
    },

    componentDidMount: function() {
        this.getCommits(false);
        this.getBranches();
    },

    getInitialState: function() {
        return {commits: [], branches: [], branch: 'master', repo: 'facebook/react', commitTimeout: null, branchTimeout: null, apiRemaining: 60, apiReset: Date.now()}
    },

    getCommits: function(skipTimeouts) {
        if(skipTimeouts)
        {
            $.get('https://api.github.com/repos/' + this.state.repo + '/commits?sha=' + this.state.branch,
              (data, textStatus, request) =>
                this.setState({ 'commits': data, 'apiRemaining': request.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(request.getResponseHeader('X-RateLimit-Reset')) * 1000 })
            ).fail((response) =>
                this.setState({ 'apiRemaining': request.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(request.getResponseHeader('X-RateLimit-Reset')) * 1000 })
            );
        }
        else
        {
            var timeout = setTimeout(function() {
              $.get('https://api.github.com/repos/' + this.state.repo + '/commits?sha=' + this.state.branch,
                (data, textStatus, request) =>
                  this.setState({ 'commits': data, 'apiRemaining': request.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(request.getResponseHeader('X-RateLimit-Reset')) * 1000 })
              ).fail((response) =>
                  this.setState({ 'apiRemaining': response.getResponseHeader('X-RateLimit-Remaining'), 'apiReset': parseInt(response.getResponseHeader('X-RateLimit-Reset')) * 1000 })
              );
              this.setState({'commitTimeout': null});
            }.bind(this), 1000);
        }

        this.setState({'commitTimeout': timeout})
    },

    getBranches: function() {
        var timeout = setTimeout(function() {
            $.get('https://api.github.com/repos/' + this.state.repo + '/branches', (data) => this.setState({'branches': data}));
            this.setState({'branchTimeout': null});
        }.bind(this), 1000);

        this.setState({'branchTimeout': timeout});
    },

    repoChange: function(event) {
        this.stopTimeouts();
        this.setState({'repo': event.target.value});
        this.getCommits(false);
        this.getBranches();
    },

    branchChange: function(event) {
        this.stopTimeouts();
        this.setState({'branch': event.target.value});
        this.getCommits(true);
    },

    stopTimeouts: function() {
        clearTimeout(this.state.commitTimeout);
        clearTimeout(this.state.branchTimeout);
        this.setState({'commitTimeout': null, 'branchTimeout': null});
    }
});

jQuery(function() {
    ReactDOM.render(<CommitsComponent />, document.getElementById('container'));
});
