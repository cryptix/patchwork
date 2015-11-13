'use babel'
import React from 'react'

class Tab extends React.Component {
  onClick() {
    this.props.onClick(this.props.option)
  }
  render() {
    const icon = this.props.selected?'check-circle-o':'circle-thin'
    return <a className={this.props.selected?'selected':''} onClick={this.onClick.bind(this)}>
      <i className={'fa fa-'+icon} /> {this.props.option.label}
    </a>
  }
}

export default class Tabs extends React.Component {
  render() {
    return <div className={'tabs'+(this.props.vertical?' vertical':'')}>
      {this.props.options.map((opt,i) => <Tab key={i} option={opt} selected={opt === this.props.selected} onClick={this.props.onSelect} />)}
    </div>
  }
}