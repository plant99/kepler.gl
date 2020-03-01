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

import {combineReducers} from 'redux';
import {handleActions} from 'redux-actions';

import keplerGlReducer, {combinedUpdaters, uiStateUpdaters, visStateUpdaters} from 'kepler.gl/reducers';
import {processGeojson, processCsvData} from 'kepler.gl/processors';
import KeplerGlSchema from 'kepler.gl/schemas';
import {EXPORT_MAP_FORMATS} from 'kepler.gl/constants';
import {ActionTypes} from 'kepler.gl/actions';
import x from 'kepler.gl/constants';

import sharingReducer from './sharing';

import {
  INIT,
  SET_LOADING_METHOD,
  LOAD_MAP_SAMPLE_FILE,
  LOAD_REMOTE_RESOURCE_SUCCESS,
  SET_SAMPLE_LOADING_STATUS,
  SAVE_EDITABLE_TO_REMOTE,
  FETCH_EDITABLE_SUCCESS,
  UPDATE_POLYGON_DETAILS,
  DELETE_POLYGON,
  SET_EDITABLE_LAYERS,
  FETCH_LAYERS_METADATA_SUCCESS
} from '../actions';

import {
  AUTH_TOKENS,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_LOADING_METHOD,
  LOADING_METHODS
} from '../constants/default-settings';
import {generateHashId, deepDiffMapper} from '../utils/strings';


// INITIAL_APP_STATE
const initialAppState = {
  appName: 'example',
  loaded: false,
  loadingMethod: DEFAULT_LOADING_METHOD,
  currentOption: DEFAULT_LOADING_METHOD.options[0],
  previousMethod: null,
  sampleMaps: [], // this is used to store sample maps fetch from a remote json file
  isMapLoading: false, // determine whether we are loading a sample map,
  error: null, // contains error when loading/retrieving data/configuration
    // {
    //   status: null,
    //   message: null
    // }
  // eventually we may have an async process to fetch these from a remote location
  featureFlags: DEFAULT_FEATURE_FLAGS
};

// App reducer
export const appReducer = handleActions({
  [INIT]: (state) => ({
    ...state,
    loaded: true
  }),
  [SET_LOADING_METHOD]: (state, action) => ({
    ...state,
    previousMethod: state.loadingMethod,
    loadingMethod: LOADING_METHODS.find(({id}) => id === action.method),
    error: null
  }),
  [LOAD_MAP_SAMPLE_FILE]: (state, action) => ({
    ...state,
    sampleMaps: action.samples
  }),
  [SET_SAMPLE_LOADING_STATUS]: (state, action) => ({
    ...state,
    isMapLoading: action.isMapLoading
  })
}, initialAppState);

const {DEFAULT_EXPORT_MAP} = uiStateUpdaters;

// combine app reducer and keplerGl reducer
// to mimic the reducer state of kepler.gl website
const demoReducer = combineReducers({
  // mount keplerGl reducer
  keplerGl: keplerGlReducer.initialState({
    // In order to provide single file export functionality
    // we are going to set the mapbox access token to be used
    // in the exported file
    uiState: {
      exportMap: {
        ...DEFAULT_EXPORT_MAP,
        [EXPORT_MAP_FORMATS.HTML]: {
          ...DEFAULT_EXPORT_MAP[[EXPORT_MAP_FORMATS.HTML]],
          exportMapboxAccessToken: AUTH_TOKENS.EXPORT_MAPBOX_TOKEN
        }
      }
    }
  }),
  app: appReducer,
  sharing: sharingReducer
});

// this can be moved into a action and call kepler.gl action
/**
 *
 * @param state
 * @param action {map: resultset, config, map}
 * @returns {{app: {isMapLoading: boolean}, keplerGl: {map: (state|*)}}}
 */
export const loadRemoteResourceSuccess = (state, action) => {
  // TODO: replace generate with a different function
  const datasetId = action.options.id || generateHashId(6);
  const {dataUrl} = action.options;
  let processorMethod = processCsvData;
  // TODO: create helper to determine file ext eligibility
  if (dataUrl.includes('.json') || dataUrl.includes('.geojson')) {
    processorMethod = processGeojson;
  }

  const datasets = {
    info: {
      id: datasetId
    },
    data: processorMethod(action.response)
  };

  const config = action.config ?
    KeplerGlSchema.parseSavedConfig(action.config) : null;

  const keplerGlInstance = combinedUpdaters.addDataToMapUpdater(
    state.keplerGl.map, // "map" is the id of your kepler.gl instance
    {
      payload: {
        datasets,
        config
      }
    }
  );

  return {
    ...state,
    app: {
      ...state.app,
      currentSample: action.options,
      isMapLoading: false // we turn of the spinner
    },
    keplerGl: {
      ...state.keplerGl, // in case you keep multiple instances
      map: keplerGlInstance
    }
  };
};

const checkExistingFeature = (featuresArray, feature) => {
  for(let i=0; i<featuresArray.length; i++) {
    if(featuresArray[i].id === feature.id) {
      return true;
    }
  }
  return false;
}

const composedUpdaters = {
  [LOAD_REMOTE_RESOURCE_SUCCESS]: loadRemoteResourceSuccess,
  [SAVE_EDITABLE_TO_REMOTE]: (state, action) => {
    // TODO show a notification
    return state;
  },
  [FETCH_LAYERS_METADATA_SUCCESS]: (state, action) => {
    let newState = Object.assign({}, state);
    let customLayers = action.metadata;
    newState.keplerGl.map.visState.customLayers = customLayers;
    return newState;
  },
  [FETCH_EDITABLE_SUCCESS]: (state, action) => {
    let newState = Object.assign({}, state);
    // initiate loadedLayers and loadedFeatures array
    if(!newState.keplerGl.map.visState.editor.loadedFeatures) {
      newState.keplerGl.map.visState.editor.loadedFeatures = [];
    }
    if(!newState.keplerGl.map.visState.editor.loadedLayers) {
      newState.keplerGl.map.visState.editor.loadedLayers = [];
    }
    // append features if layer is not already loaded
    let loadedFeatures = newState.keplerGl.map.visState.editor.loadedFeatures;
    let loadedLayers = newState.keplerGl.map.visState.editor.loadedLayers;
    if(loadedLayers.indexOf(action.layerId) === -1) {
      // load editable features
      newState.keplerGl.map.visState.editor.loadedFeatures = loadedFeatures.concat(action.editables);
      // append layerId
      newState.keplerGl.map.visState.editor.loadedLayers.push(Number(action.layerId));
    }
    return newState;
  },

  // set editable layers
  [SET_EDITABLE_LAYERS]: (state, action) => {
    let newState = Object.assign({}, state);
    const layerIds = action.layerIds;
    let features = [];

    const loadedFeatures = newState.keplerGl.map.visState.editor.loadedFeatures;
    console.log(loadedFeatures, layerIds);
    for(let i=0; i<loadedFeatures.length; i++) {
      if(layerIds.indexOf(loadedFeatures[i].layerId) != -1) {
        features.push(loadedFeatures[i]);
      }
    }
    newState.keplerGl.map.visState.editor.features = features;
    return newState;
  },
  [UPDATE_POLYGON_DETAILS]: (state, action) => {
    // modify state here
    let newState = Object.assign({}, state);
    let features = newState.keplerGl.map.visState.editor.features;
    let loadedLayers = newState.keplerGl.map.visState.editor.loadedLayers;
    for(let i=0; i<features.length; i++) {
      if(features[i].id == action.polygonId) {
        // new polygons
        if(!features[i].properties.custom) {
          features[i].properties.custom = {};
          features[i].layerId = action.layerId;
          // to close the modal
          newState.keplerGl.map.visState.newFeatureModal = null;
        }
        features[i].properties.custom.title = action.title;
        features[i].properties.custom.description = action.description;
        features[i].properties.custom.layer_id = action.layerId;
        // TODO: check if layerId in visible layers else hide it, and remove dependency from layerId
        // use custom.layer_id instead
        features[i].properties.layerId = action.layerId;
        // remove from editable.layers if new layerId is not in visible layers
        // if condition because, if layers aren't loaded loadedLayers is null
        if(loadedLayers){
          if(loadedLayers.indexOf(Number(action.layerId)) === -1) {
            features.splice(i, 1);
            newState.keplerGl.map.visState.editor.selectedFeature = null;
          }else{
            // since action id is active polygon
            newState.keplerGl.map.visState.editor.selectedFeature = features[i];
          }
        }
      }
    }
    // save features to state
    newState.keplerGl.map.visState.editor.features = JSON.parse(JSON.stringify(features));
    return newState;
  },
  [DELETE_POLYGON]: (state, action) => {

    // !undefined = true, so will work even if value isn't initialized while declaring initial state

    // !IMPORTANT! without cloning redux is finding no difference, ask someone who understands react-redux
    // better for a more clear explanation

    let features = JSON.parse(JSON.stringify(state.keplerGl.map.visState.editor.features));
    for(let i=0; i<features.length; i++) {
      if(features[i].id == action.polygonId) {
        features.splice(i, 1);
        break;
      }
    }
    if(!state.keplerGl.map.visState.deletedIds) {
      state.keplerGl.map.visState.deletedIds = [action.polygonId];
    }else{
      state.keplerGl.map.visState.deletedIds.push(action.polygonId);
    }
    state.keplerGl.map.visState.editor = {...state.keplerGl.map.visState.editor, features, selectedFeature:null};
    return state;
  }
};

const checkFeatureLoaded = (loadedFeatures, editorFeatures) => {
  if(!loadedFeatures) {
    return false;
  }
  // most recent addition
  const feature = editorFeatures[editorFeatures.length-1];
  let available = false;
  for(let i=0; i<loadedFeatures.length; i++) {
    if(loadedFeatures[i].id === feature.id) {
      return true;
    }
  }
  return false;
}

const composedReducer = (state, action) => {
  let newState = Object.assign({}, state);
  // set tooltip option if clicked on activated layer while 
  if(action.type === ActionTypes.LAYER_CLICK) {
    const selectedFeature = Object.assign({}, newState.keplerGl.map.visState.editor.selectedFeature);
    if(selectedFeature) {
      // if clicked within selected feature, add tooltip
      const coords = action.payload.info.lngLat;
      const latlngs = selectedFeature.geometry.coordinates;
      const polygon = L.polygon(latlngs);
      const contains = polygon.getBounds().contains(L.latLng(coords[0], coords[1]));
      if(contains) {
        // set tooltip is true for selectedFeature
        selectedFeature.tooltip = {
          visible: true,
          // TODO: remove position, as if map moves, it'd be hard to attach tooltip to polygon
          position: [action.payload.info.x, action.payload.info.y]
        };
      }else{
        // remove existing polygon
        selectedFeature.tooltip = null;
      }
      newState.keplerGl.map.visState.editor.selectedFeature = selectedFeature;
    }
    // else selectedFeature = null, and tooltip rendering happens after checking this.
  }else if(action.type === ActionTypes.SET_FEATURES) {
    const features = action.payload.features;
    let newestFeature = features[features.length-1];
    let loadedFeatures = newState.keplerGl.map.visState.editor.loadedFeatures;
    console.log(loadedFeatures, features);
    if(!checkFeatureLoaded(loadedFeatures, features)) {
      // set new feature modal as true
      newState.keplerGl.map.visState.newFeatureModal = true;
      if(loadedFeatures){
        newState.keplerGl.map.visState.editor.loadedFeatures.push(newestFeature);
      }else{
        newState.keplerGl.map.visState.editor.loadedFeatures = [newestFeature];
      }
    }
  }
  console.log(action, state);
  if (composedUpdaters[action.type]) {
    return composedUpdaters[action.type](newState, action);
  }
  return demoReducer(newState, action);
};

// export demoReducer to be combined in website app
export default composedReducer;
