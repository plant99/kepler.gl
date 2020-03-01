// Copyright (c) 2020 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import React from 'react';
import styled from 'styled-components';
import {connect} from 'react-redux';
import {Icons} from 'kepler.gl/components';
import {updatePolygonDetails, deletePolygon} from '../actions';

const StyledEditablePropertiesControl = styled.div`
  align-items: center;
  background-color: grey;
  border-radius: 5px;
  color: ${props => props.fontColor};
  // display: fixed;
  height: ${props => props.height}px;
  justify-content: space-between;
  padding: 0 40px;
  position: fixed;
  transition: top 1s;
  width: 100%;
  z-index: 9999;

  svg:hover {
    cursor: pointer;
  }
`;

class CreateEditablePropertiesControl extends React.Component{
  constructor(props) {
    super(props);
  }

  _onUpdateClick() {
    // get values of title and description
    const title = document.getElementById('new-title-polygon').value;
    const description = document.getElementById('new-description-polygon').value;
    const polygonId = document.getElementById('new-update-polygon').getAttribute('polygon_id');
    const layerId = Number(document.getElementById('new-update-editable-layer').value);
    this.props.onUpdateClick(polygonId, title, description, layerId);
  }

  _onDeleteClick() {
    // get values of title and description
    const polygonId = document.getElementById('delete-polygon').getAttribute('polygon_id'); 
    this.props.onDeleteClick(polygonId);
  }

  render() {
    if(!this.props.newFeatureModal){
      return null;
    }
    let features = this.props.editor.features;
    let feature = features[features.length-1];
    // load change layer dropdown
    const customLayers = this.props.customLayers;
    let options = [];
    for(let i=0; i<customLayers.length; i++) {
      if(customLayers[i].editable) {
        options.push(<option key={i} value={customLayers[i].id}>{customLayers[i].title}</option>)
      }
    }
    return (
      <div style={{
        position: "fixed",
        top: '400px',
        left: '400px',
        color: "white",
        backgroundColor: "grey",
        borderRadius: "5px",
        padding: "10px",
      }}>
        <div id="new-update-popup">
          <p><label>Title: <input type="text" name="title" id="new-title-polygon" defaultValue={""}/></label></p>
          <p><label>Description: <input type="text" name="description" id="new-description-polygon" defaultValue={""} /></label></p>
          <div>
            <select id="new-update-editable-layer" defaultValue={feature.id}>
              {options}
            </select>
          </div>
          <button id="new-update-polygon" polygon_id={feature.id} onClick={this._onUpdateClick.bind(this)}>Save</button>
        </div>
      </div>
    )
  };

}

const mapStateToProps = state => {
  if(state.demo.keplerGl.map) {
    return state.demo.keplerGl.map.visState;
  }else{
    return state;
  }
};
const dispatchToProps = dispatch => ({
  onUpdateClick(polygonId, title, description, layerId) {
    dispatch(updatePolygonDetails(polygonId, title, description, layerId));
  },
  onDeleteClick(polygonId) {
    dispatch(deletePolygon(polygonId))
  }
});

export default connect(
  mapStateToProps,
  dispatchToProps,
  null,
  {
    pure: false
  }
)(CreateEditablePropertiesControl);

