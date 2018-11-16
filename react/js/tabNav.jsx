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
                <ul className='tab tab-block'>
                    {this.props.tabs.map((tab, index) => {
                        return <Tab 
                            key={index}
                            tab={tab} 
                            active={tab === this.state.activeTab} 
                            onTabClick={this.tabClicked} />;
                    })}
                </ul>
                <div>
                    {this.state.activeTab.content}
                </div>
            </React.Fragment>
        );
    }
}

export class Tab extends React.Component {
    constructor(props) {
        super(props);
        this.handleTabClick = this.handleTabClick.bind(this);
    }
    
    handleTabClick() {
        this.props.onTabClick(this.props.tab);
    }

    render() {
        return (
            <li className='tab-item c-hand'>
                <a className={this.props.active ? 'active' : ''} onClick={this.handleTabClick}>
                    {this.props.tab.name}
                </a>
            </li>
        );
    }
}