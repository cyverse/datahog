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
        this.onChange = this.onChange.bind(this);

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
            created: response.data.modified,
            modified: response.data.modified,
            accessed: response.data.accessed,
            data: response.data.graph_data,
            total: response.data.total,
            loading: false,
            error: false
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

    onChange(event) {
        this.setState({
            [event.target.name]: (event.target.value === 'on') ? 
                event.target.checked : event.target.value
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
                        <select value={this.state.days} name='days' className="form-select" onChange={this.onChange}>
                            <option value={7}>7 days</option>
                            <option value={30}>30 days</option>
                            <option value={90}>90 days</option>
                        </select>
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input type="checkbox" name='viewCreated' checked={this.state.viewCreated} onChange={this.onChange}/>
                                <i className="form-icon"></i> Created
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input type="checkbox" name='viewModified' checked={this.state.viewModified} onChange={this.onChange}/>
                                <i className="form-icon"></i> Modified
                            </label>
                        </div>
                        <div className="form-group">
                            <label className="form-checkbox">
                                <input type="checkbox" name='viewAccessed' checked={this.state.viewAccessed} onChange={this.onChange}/>
                                <i className="form-icon"></i> Accessed
                            </label>
                        </div>
                    </div>
                    <div className="column">
                        <ActivityTimeline 
                            data={this.state.data}
                            days={this.state.days}
                            viewCreated={this.state.viewCreated}
                            viewModified={this.state.viewModified}
                            viewAccessed={this.state.viewAccessed}
                            id="activityTimeline"
                        />
                    </div>
                </div>
            </div>
        );
    }
}