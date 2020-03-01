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

import {push} from 'react-router-redux';
import {request, text as requestText, json as requestJson} from 'd3-request';
import {loadFiles, toggleModal} from 'kepler.gl/actions';
import {parse, stringify} from 'wellknown';

import {
  LOADING_SAMPLE_ERROR_MESSAGE,
  LOADING_SAMPLE_LIST_ERROR_MESSAGE,
  MAP_CONFIG_URL, MAP_URI
} from './constants/default-settings';
import {LOADING_METHODS_NAMES} from './constants/default-settings';
import {getCloudProvider} from './cloud-providers';
import {generateHashId} from './utils/strings';
import {parseUri} from './utils/url';
import KeplerGlSchema from 'kepler.gl/schemas';
import {processGeojson} from 'kepler.gl/processors';
import {addDataToMap} from 'kepler.gl/actions';
import readOnlyConfig from './data/read-only-config';

// CONSTANTS
export const INIT = 'INIT';
export const SET_LOADING_METHOD = 'SET_LOADING_METHOD';
export const LOAD_REMOTE_RESOURCE_SUCCESS = 'LOAD_REMOTE_RESOURCE_SUCCESS';
export const LOAD_REMOTE_RESOURCE_ERROR = 'LOAD_REMOTE_RESOURCE_ERROR';
export const LOAD_MAP_SAMPLE_FILE = 'LOAD_MAP_SAMPLE_FILE';
export const SET_SAMPLE_LOADING_STATUS = 'SET_SAMPLE_LOADING_STATUS';
export const SAVE_EDITABLE_TO_REMOTE = 'SAVE_EDITABLE_TO_REMOTE';
export const FETCH_EDITABLE_SUCCESS = 'FETCH_EDITABLE_SUCCESS';
export const UPDATE_POLYGON_DETAILS = 'UPDATE_POLYGON_DETAILS';
export const DELETE_POLYGON = 'DELETE_POLYGON';
export const SET_EDITABLE_LAYERS = 'SET_EDITABLE_LAYERS';
export const FETCH_LAYERS_METADATA_SUCCESS = 'FETCH_LAYERS_METADATA_SUCCESS';

// Sharing
export const PUSHING_FILE = 'PUSHING_FILE';
export const CLOUD_LOGIN_SUCCESS  = 'CLOUD_LOGIN_SUCCESS';

// ACTIONS
export function initApp() {
  return {
    type: INIT
  };
}

/**
 * this method set the current loading method
 * @param {string} method the string id for the loading method to use
 * @returns {{type: string, method: *}}
 */
export function setLoadingMethod(method) {
  return {
    type: SET_LOADING_METHOD,
    method
  };
}

/**
 * this action is triggered when user switches between load modal tabs
 * @param {string} method
 * @returns {Function}
 */
export function switchToLoadingMethod(method) {
  return (dispatch, getState) => {
    dispatch(setLoadingMethod(method));
    if (method === LOADING_METHODS_NAMES.sample && getState().demo.app.sampleMaps.length === 0) {
      dispatch(loadSampleConfigurations());
    }
  };
}

export function loadRemoteResourceSuccess(response, config, options) {
  return {
    type: LOAD_REMOTE_RESOURCE_SUCCESS,
    response,
    config,
    options
  };
}

export function setEditableLayers(layerIds) {
  return {
    type: SET_EDITABLE_LAYERS,
    layerIds
  }
}

export function loadRemoteResourceError(error, url) {
  return {
    type: LOAD_REMOTE_RESOURCE_ERROR,
    error,
    url
  }
}

export function loadMapSampleFile(samples) {
  return {
    type: LOAD_MAP_SAMPLE_FILE,
    samples
  };
}

export function setLoadingMapStatus(isMapLoading) {
  return {
    type: SET_SAMPLE_LOADING_STATUS,
    isMapLoading
  };
}

/**
 * this method detects whther the response status is < 200 or > 300 in case the error
 * is not caught by the actualy request framework
 * @param response the response
 * @returns {{status: *, message: (*|{statusCode}|Object)}}
 */
function detectResponseError(response) {
  if (response.statusCode && (response.statusCode < 200 || response.statusCode >= 300)) {
    return {
      status: response.statusCode,
      message: response.body || response.message || response
    }
  }
}

// This can be moved into Kepler.gl to provide ability to load data from remote URLs
/**
 * The method is able to load both data and kepler.gl files.
 * It uses loadFile action to dispatcha and add new datasets/configs
 * to the kepler.gl instance
 * @param options
 * @param {string} options.dataUrl the URL to fetch data from. Current supoprted file type json,csv, kepler.json
 * @returns {Function}
 */
export function loadRemoteMap(options) {
  return dispatch => {
    dispatch(setLoadingMapStatus(true));
    // breakdown url into url+query params
    loadRemoteRawData(options.dataUrl).then(
      // In this part we turn the response into a FileBlob
      // so we can use it to call loadFiles
      ([file, url]) => {
        const {file: filename} = parseUri(url);
        dispatch(loadFiles([
          new File([file], filename)
        ])).then(
          () => dispatch(setLoadingMapStatus(false))
        );

      },
      error => {
        const {target = {}} = error;
        const {status, responseText} = target;
        dispatch(loadRemoteResourceError({status, message: responseText}, options.dataUrl));
      }
    );
  }
}

/**
 * Load a file from a remote URL
 * @param url
 * @returns {Promise<any>}
 */
function loadRemoteRawData(url) {
  if (!url) {
    // TODO: we should return reject with an appropriate error
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    request(url, (error, result) => {
      if (error) {
        reject(error);
      }
      const responseError = detectResponseError(result);
      if (responseError) {
        reject(responseError);
        return;
      }
      resolve([result.response, url])
    })
  });
}

export function saveEditableToRemoteAction() {
  return {
    type: SAVE_EDITABLE_TO_REMOTE
  };
}

export function fetchEditableSuccess(editables, layerId) {
  return {
    type: FETCH_EDITABLE_SUCCESS,
    editables,
    layerId
  }
}

export function fetchLayersMetadataSuccess(metadata) {
  return {
    type: FETCH_LAYERS_METADATA_SUCCESS,
    metadata
  }
}

export function updatePolygonDetails(polygonId, title, description, layerId) {
  return {
    type: UPDATE_POLYGON_DETAILS,
    polygonId,
    title,
    description,
    layerId
  }
}

export function deletePolygon(polygonId) {
  return {
    type: DELETE_POLYGON,
    polygonId
  }
}

async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *client
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return await response.json(); // parses JSON response into native JavaScript objects
}

export function saveEditableToRemote() {
  return (dispatch, getState) => {
    let features = getState()["demo"]["keplerGl"]["map"]["visState"]["editor"]["features"];
    let requestPromises = [];
    // save features
    for(let i=0; i<features.length; i++) {
      let promise = null;
      if(Math.round(features[i].id) === features[i].id) {
        // update this polygon
        const url = "http://localhost:8000/polygon/update";
        let data = {
          id: features[i].id,
          title: features[i].properties.custom.title,
          description: features[i].properties.custom.description,
          geom: JSON.stringify(features[i].geometry),
          layer_id: features[i].properties.custom.layer_id
        }
        console.log(data);
        promise = postData(url, data)
      }else {
        // create this polygon
        const url = "http://localhost:8000/polygon/create";
        let data = {
          title: features[i].properties.custom.title,
          description: features[i].properties.custom.description,
          geojson: JSON.stringify(features[i].geometry),
          layer_id: features[i].properties.custom.layer_id
        }
        promise = postData(url, data)
      }
      requestPromises.push(promise);
    }

    // delete features
    let deletedIds = getState()["demo"]["keplerGl"]["map"]["visState"]["deletedIds"]
    if(deletedIds) {
      for(let i=0; i<deletedIds.length; i++) {
        const url = `http://localhost:8000/polygon/delete/${deletedIds[i]}`;
        requestPromises.push(fetch(url));
      }
    }

    Promise.all(requestPromises)
    .then((results) => {
      dispatch(saveEditableToRemoteAction());
    })
    .catch(errors => {
      console.log(errors);
    });
    
  }
}

export function loadEditableData() {
  return (dispatch, getState) => {
    const url = "http://localhost:8000/polygons/";
    fetch(url)
      .then(data => {
        return data.json();
      })
      .then(jsonData =>{
        let listPoly = jsonData;
        let features = [];
        for(let i=0; i<listPoly.length; i++){
          const feature = {
            geometry: parse(listPoly[i].geom),
            type: "Feature",
            properties: {
              custom: listPoly[i],
              renderType: "Polygon",
            },
            id: listPoly[i].id,
          };
          features.push(feature);
        }
        // emit event
        dispatch(fetchEditableSuccess(features));
      })
      .catch(err => {
        // TODO change status
        dispatch(loadRemoteResourceError({status: 404, message: "Couldn't save editable polygons"}, url));
      });
  }
}

export function loadLayersMetadata() {
  return (dispatch, getState) => {
    const url = "http://localhost:8000/layers";
    fetch(url)
      .then(data => {
        return data.json();
      })
      .then(jsonData =>{
        dispatch(fetchLayersMetadataSuccess(jsonData));
      })
      .catch(err => {
        // TODO change status
        dispatch(loadRemoteResourceError({status: 404, message: "Couldn't save editable polygons"}, url));
      });
  }
}


export function loadEditableDataLayer(layerId) {
  return (dispatch, getState) => {
    const url = "http://localhost:8000/pgs_by_layer/?layer_id="+layerId;
    fetch(url)
      .then(data => {
        return data.json();
      })
      .then(jsonData =>{
        let listPoly = jsonData;
        let features = [];
        for(let i=0; i<listPoly.length; i++){
          const feature = {
            geometry: parse(listPoly[i].geom),
            type: "Feature",
            properties: {
              custom: listPoly[i],
              renderType: "Polygon",
            },
            id: listPoly[i].id,
            layerId: listPoly[i].layer_id
          };
          features.push(feature);
        }
        // emit event
        dispatch(fetchEditableSuccess(features, layerId));
      })
      .catch(err => {
        // TODO change status
        console.log(err);
        dispatch(loadRemoteResourceError({status: 404, message: "Couldn't save editable polygons"}, url));
      });
  }
}


export function loadReadOnlyDataLayer(layer_id) {
  return (dispatch) => {
    // dispatch(loadRemoteResourceSuccess({},{},{dataUrl: 'http://localhost:8000/public/ro.json'}));
    loadRemoteData('http://localhost:8000/public/ro.json')
      .then(data => {
        dispatch(addDataToMap({
          datasets: {
            info: {
              label: 'Custom read only',
              id: 'custom-read-only'
            },
            data: processGeojson(data)
          },
          options: {
            keepExistingConfig: true
          },
          config: readOnlyConfig
        }))
        // dispatch(loadRemoteResourceSuccess(data, {}, {dataUrl: 'http://localhost:8000/public/ro.json'}));
      })
      .catch(error => {
        console.log("error has occured", error);
      })
  }
}

// The following methods are only used to load SAMPLES
/**
 *
 * @param {Object} options
 * @param {string} [options.dataUrl] the URL to fetch data from, e.g. https://raw.githubusercontent.com/uber-web/kepler.gl-data/master/earthquakes/data.csv
 * @param {string} [options.configUrl] the URL string to fetch kepler config from, e.g. https://raw.githubusercontent.com/uber-web/kepler.gl-data/master/earthquakes/config.json
 * @param {string} [options.id] the id used as dataset unique identifier, e.g. earthquakes
 * @param {string} [options.label] the label used to describe the new dataset, e.g. California Earthquakes
 * @param {string} [options.queryType] the type of query to execute to load data/config, e.g. sample
 * @param {string} [options.imageUrl] the URL to fetch the dataset image to use in sample gallery
 * @param {string} [options.description] the description used in sample galley to define the current example
 * @param {string} [options.size] the number of entries displayed in the current sample
 * @param {string} [keplergl] url to fetch the full data/config generated by kepler
 * @returns {Function}
 */
export function loadSample(options, pushRoute = true) {
  return (dispatch, getState) => {
    const {routing} = getState();
    if (options.id && pushRoute) {
      dispatch(push(`/demo/${options.id}${routing.locationBeforeTransitions.search}`));
    }
    // if the sample has a kepler.gl config file url we load it
    if (options.keplergl) {
      dispatch(loadRemoteMap({dataUrl: options.keplergl}));
    } else {
      dispatch(loadRemoteSampleMap(options));
    }

    dispatch(setLoadingMapStatus(true));
  };
}

/**
 * Load remote map with config and data
 * @param options {configUrl, dataUrl}
 * @returns {Function}
 */
function loadRemoteSampleMap(options) {
  return (dispatch) => {
    // Load configuration first
    const {configUrl, dataUrl} = options;

    Promise
      .all([loadRemoteConfig(configUrl), loadRemoteData(dataUrl)])
      .then(
        ([config, data]) => {
          // TODO: these two actions can be merged
          dispatch(loadRemoteResourceSuccess(data, config, options));
          dispatch(toggleModal(null));
        },
        error => {
          if (error) {
            const {target = {}} = error;
            const {status, responseText} = target;
            dispatch(loadRemoteResourceError({status, message: `${responseText} - ${LOADING_SAMPLE_ERROR_MESSAGE} ${options.id} (${configUrl})`}, configUrl));
          }
        }
      );
  }
}

/**
 *
 * @param url
 * @returns {Promise<any>}
 */
function loadRemoteConfig(url) {
  if (!url) {
    // TODO: we should return reject with an appropriate error
    return Promise.resolve(null)
  }

  return new Promise((resolve, reject) => {
    requestJson(url, (error, config) => {
      if (error) {
        reject(error);
      }
      const responseError = detectResponseError(config);
      if (responseError) {
        reject(responseError);
        return;
      }
      resolve(config);
    })
  })
}

/**
 *
 * @param url to fetch data from (csv, json, geojson)
 * @returns {Promise<any>}
 */
function loadRemoteData(url) {
  if (!url) {
    // TODO: we should return reject with an appropriate error
    return Promise.resolve(null)
  }

  let requestMethod = requestText;
  if (url.includes('.json') || url.includes('.geojson')) {
    requestMethod = requestJson;
  }

  // Load data
  return new Promise((resolve, reject) => {
    requestMethod(url, (error, result) => {
      if (error) {
        reject(error);
      }
      const responseError = detectResponseError(result);
      if (responseError) {
        reject(responseError);
        return;
      }
      resolve(result);
    })
  });
}

/**
 *
 * @param sampleMapId optional if we pass the sampleMapId, after fetching
 * map sample configurations we are going to load the actual map data if it exists
 * @returns {function(*)}
 */
export function loadSampleConfigurations(sampleMapId = null) {
  return dispatch => {
    requestJson(MAP_CONFIG_URL, (error, samples) => {
      if (error) {
        const {target = {}} = error;
        const {status, responseText} = target;
        dispatch(loadRemoteResourceError({status, message: `${responseText} - ${LOADING_SAMPLE_LIST_ERROR_MESSAGE}`}, MAP_CONFIG_URL));
      } else {
        const responseError = detectResponseError(samples);
        if (responseError) {
          dispatch(loadRemoteResourceError(responseError, MAP_CONFIG_URL));
          return;
        }

        dispatch(loadMapSampleFile(samples));
        // Load the specified map
        const map = sampleMapId && samples.find(s => s.id === sampleMapId);
        if (map) {
          dispatch(loadSample(map, false));
        }
      }
    });
  }
}

/**
 * this action will be triggered when the file is being uploaded
 * @param isLoading
 * @param metadata
 * @returns {{type: string, isLoading: *, metadata: *}}
 */
export function setPushingFile(isLoading, metadata) {
  return {
    type: PUSHING_FILE,
    isLoading,
    metadata
  };
}

/**
 * This method will export the current kepler config file to the choosen cloud platform
 * @param data
 * @param providerName
 * @returns {Function}
 */
export function exportFileToCloud(providerName) {
  if (!providerName) {
    throw new Error('No cloud provider identified')
  }
  const cloudProvider = getCloudProvider(providerName);
  return (dispatch, getState) => {
    // extract data from kepler
    const mapData = KeplerGlSchema.save(getState().demo.keplerGl.map);
    const data = JSON.stringify(mapData);
    const newBlob = new Blob([data], {type: 'application/json'});
    const fileName = `/keplergl_${generateHashId(6)}.json`;
    const file = new File([newBlob], fileName);
    // We are gonna pass the correct auth token to init the cloud provider
    dispatch(setPushingFile(true, {filename: file.name, status: 'uploading', metadata: null}));
    cloudProvider.uploadFile({
      data,
      type: 'application/json',
      blob: file,
      name: fileName,
      isPublic: true,
      cloudProvider
    })
    // need to perform share as well
    .then(
      response => {
        if (cloudProvider.shareFile) {
          dispatch(push(`/${MAP_URI}${response.url}`));
        }
        dispatch(setPushingFile(false, {filename: file.name, status: 'success', metadata: response}));
      },
      error => {
        dispatch(setPushingFile(false, {filename: file.name, status: 'error', error}));
      }
    );
  };
}

export function setCloudLoginSuccess(providerName) {
  return dispatch => {
    dispatch({type: CLOUD_LOGIN_SUCCESS}).then(
      () => {
        dispatch(exportFileToCloud(providerName));
      },
      () => {
        dispatch(setPushingFile(false, {filename: null, status: 'error', error: 'not able to propagate login successfully'}));
      }
    );
  };
}
