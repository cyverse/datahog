import React from 'react';
import axios from '../axios';
import { ActivityTimeline } from './activityTimeline';

const PIE_COLORS = [
    '#e5f5e0', '#c7e9c0', '#a1d99b', '#74c476', '#41ab5d', '#238b45', 
];

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
            graph_data: [],
            days: 30
        };
        
        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.getActivity = this.getActivity.bind(this);
        this.onChange = this.onChange.bind(this);

        this.getActivity();
    }

    componentWillUnmount() {
        if (this.cancelToken) this.cancelToken.cancel();
    }

    getActivity() {
        this.cancelToken = axios.CancelToken.source();
        axios.get('/api/filedata/activity', {
            params: {
                source: this.props.source.id
            },
            cancelToken: this.cancelToken.token
        })
        .then(this.onLoad)
        .catch(this.onError);
    }

    onLoad(response) {
        console.log(response);
        this.setState({
            created: response.data.modified,
            modified: response.data.modified,
            accessed: response.data.accessed,
            graph_data: response.data.graph_data,
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

    onChange(event) {
        this.setState({
            days: event.target.value,
            loading: true
        });
        this.getActivity();
    }

    render() {
        return (
            <div className="card fixed-height">
                <div className="card-header">
                    <div className="card-title h5">File Activity from the last</div>
                    <select value={this.state.days} className="form-select" onChange={this.onChange}>
                        <option value={7}>7 days</option>
                        <option value={30}>30 days</option>
                        <option value={90}>90 days</option>
                    </select>
                </div>
                <div className="card-body">
                    <ActivityTimeline data={this.state.graph_data} id="activityTimeline"/>
                    Created: {this.state.created},
                    Modified: {this.state.modified},
                    Accessed: {this.state.accessed}
                </div>
            </div>
        );
    }
}