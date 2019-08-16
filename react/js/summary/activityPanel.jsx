import React from 'react';
import axios from '../axios';
import { ActivityTimeline } from './activityTimeline';

/**
 * A panel describing file creation/modification/access in the recent past.
 */
export class ActivityPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loading: true,
            error: false,
            created: 0,
            modified: 0,
            accessed: 0,
            total: 0,
            data: [],
            days: 30,
            viewCreated: true,
            viewModified: true,
            viewAccessed: true
        };
        
        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.changeDays = this.changeDays.bind(this);
        this.changeVisibility = this.changeVisibility.bind(this);

        this.cancelToken = axios.CancelToken.source();
        axios.get('/api/filedata/activity', {
            params: {
                source: this.props.source,
                days: 90
            },
            cancelToken: this.cancelToken.token
        })
        .then(this.onLoad)
        .catch(this.onError);
    }

    onLoad(response) {
        this.setState({
            data: response.data,
            loading: false,
            error: false,
            ...countTotals(response.data, this.state.days)
        });
    }

    onError(error) {
        this.setState({
            loading: false,
            error: true
        });
    }

    componentWillUnmount() {
        if (this.cancelToken) this.cancelToken.cancel();
    }

    changeDays(event) {
        this.setState({
            days: event.target.value,
            ...countTotals(this.state.data, event.target.value)
        });
    }

    changeVisibility(event) {
        this.setState({
            [event.target.name]: event.target.checked
        });
    }

    render() {
        return (
            <div className="card fixed-height">
                <div className="card-header">
                    <div className="card-title h5">File Activity from the last</div>
                </div>
                <div className="card-body columns">
                    <div className="column">
                        <select value={this.state.days} name='days' className="form-select" onChange={this.changeDays}>
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={90}>90 days</option>
                        </select>
                        { this.props.source.has_creation_times && 
                            <div className="form-group">
                                <label className="form-checkbox">
                                    <input type="checkbox" name='viewCreated' checked={this.state.viewCreated} onChange={this.changeVisibility}/>
                                    <i className="form-icon"></i> { this.state.created } Created
                                </label>
                            </div>
                        }
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input type="checkbox" name='viewModified' checked={this.state.viewModified} onChange={this.changeVisibility}/>
                                <i className="form-icon"></i> { this.state.modified } Modified
                            </label>
                        </div>
                        { this.props.source.has_access_times &&    
                            <div className="form-group">
                                <label className="form-checkbox">
                                    <input type="checkbox" name='viewAccessed' checked={this.state.viewAccessed} onChange={this.changeVisibility}/>
                                    <i className="form-icon"></i> { this.state.accessed } Accessed
                                </label>
                            </div>
                        }
                    </div>
                    <div className="column">
                        <ActivityTimeline 
                            data={this.state.data}
                            days={this.state.days}
                            viewCreated={this.props.source.has_creation_times && this.state.viewCreated}
                            viewModified={this.state.viewModified}
                            viewAccessed={this.props.source.has_access_times && this.state.viewAccessed}
                            id="activityTimeline"
                        />
                    </div>
                </div>
            </div>
        );
    }
}


function countTotals(data, days) {
    let ctotal = 0, mtotal = 0, atotal = 0;

    for (let i = data.length - days; i < data.length; i++) {
        ctotal += data[i].created;
        mtotal += data[i].modified;
        atotal += data[i].accessed;
    }
    
    return {
        created: ctotal,
        modified: mtotal,
        accessed: atotal
    };
}