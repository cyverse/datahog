import React from 'react';

export class TabNav extends React.Component {
    constructor(props) {
        super(props);

        if (props.tabs.length > 0) this.state = {
            activeTab: props.tabs[0]
        }

        this.tabClicked = this.tabClicked.bind(this);
    }

    tabClicked(tab) {
        this.setState({
            activeTab: tab
        });
    }

    render() {
        return (
            <React.Fragment>
                <nav id="tabs">
                    {this.props.tabs.map(tab => {
                        return <TabButton 
                            tab={tab} 
                            active={tab === this.state.activeTab} 
                            onTabClick={this.tabClicked}>
                        </TabButton>;
                    })}
                </nav>
                <div>
                    {this.state.activeTab && this.state.activeTab.content}
                </div>
            </React.Fragment>
        );
    }
}

export class TabButton extends React.Component {
    constructor(props) {
        super(props);
        this.handleTabClick = this.handleTabClick.bind(this);
    }
    
    handleTabClick() {
        this.props.onTabClick(this.props.tab);
    }

    render() {
        return <button 
            className={this.props.active ? 'button-outline' : 'button-clear'}
            onClick={this.handleTabClick}>
                {this.props.tab.name}
        </button>;
    }
}