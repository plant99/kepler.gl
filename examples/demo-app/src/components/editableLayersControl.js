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
import {setEditableLayers} from '../actions';

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
  z-index: 10000;

  svg:hover {
    cursor: pointer;
  }
`;

class EditableLayersControl extends React.Component{
  constructor(props) {
    super(props);
  }

  _onSubmit() {
    let editableLayers = document.getElementsByName("editable-layers-selection");
    // if(typeof(editableLayers) !=)
    let checked = [];
    for (var i = editableLayers.length - 1; i >= 0; i--) {
      if(editableLayers[i].checked) {
        checked.push(Number(editableLayers[i].getAttribute('id')));
      }
    }
    this.props.onSetEditableLayers(checked);
  }

  render() {
    let checkboxes = [];
    if(this.props.editor && this.props.editor.loadedLayers){
      for(var i=0; i<this.props.editor.loadedLayers.length; i++) {
        checkboxes.push(<label key={i}><input type="checkbox" name="editable-layers-selection" id={this.props.editor.loadedLayers[i]} /> {this.props.editor.loadedLayers[i]}</label>)
        checkboxes.push(<br key={i+"break"}></br>)
      }
    }
    return (
        <div style={{
          position: "fixed",
          top: "400px",
          right: "10px",
          color: "white",
          backgroundColor: "grey",
          borderRadius: "5px",
          padding: "10px",
        }}
        >
          <form action="#" id="layers-select-form" disabled={true} onSubmit={() => null}>
            <h4>
              Choose editable layers to visualize
            </h4>
            {
              checkboxes
            }
          </form>

          <button id="submit-editable-layer-select"
            onClick={this._onSubmit.bind(this)}
          >Change</button>
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
  onSetEditableLayers(layerIds) {
    dispatch(setEditableLayers(layerIds))
  }
});

export default connect(
  mapStateToProps,
  dispatchToProps,
  null,
  {
    pure: false
  }
)(EditableLayersControl);

