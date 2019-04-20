import React from 'react';
import { Paginator } from './paginator';
import { FileTable } from './fileTable';

export class PaginatedPanel extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            files: [],
            loading: true,
            error: false
        };

        this.onLoad = this.onLoad.bind(this);
        this.onError = this.onError.bind(this);
        this.onClick = this.onClick.bind(this);
    }

    onClick() {
        this.setState({
            loading: true
        });
    }

    onLoad(files) {
        this.setState({
            files: files || [],
            loading: false,
            error: false
        });
    }

    onError(error) {
        this.setState({
            files: [],
            loading: false,
            error: true
        });
    }

    render() {
        if (this.props.get) {
            return (
                <div className="card fixed-height">
                    <div className="card-header">
                        <div className="card-title h5">
                            {this.props.title}
                        </div>
                    </div>
                    <div className="card-body">
                        {this.state.loading ?
                            <div className="loading"></div> :
                            <FileTable files={this.state.files} showDate={this.props.showDate}/>
                        }
                    </div>
                    <div className="card-footer">
                        <Paginator
                            get={this.props.get}
                            pageSize={10}
                            params={this.props.params}
                            onLoad={this.onLoad}
                            onError={this.onError}
                            onClick={this.onClick}
                        />
                    </div>
                </div>
            );
        } else {
            return (
                <div className="card fixed-height"></div>
            );
        }
    }
}