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

const config = {
  version: 'v1',
  config: {
    visState: {
      filters: [],
      layers: [
        {
          id: 'ze2p6id',
          type: 'geojson',
          config: {
            dataId: 'custom-read-only',
            label: 'Custom Read Only',
            color: [151, 14, 45],
            columns: {
              geojson: '_geojson'
            },
            isVisible: true,
            visConfig: {
              opacity: 0.8,
              thickness: 0.5,
              strokeColor: [77, 193, 156],
              colorRange: {
                name: 'Global Warming',
                type: 'sequential',
                category: 'Uber',
                colors: [
                  '#5A1846',
                  '#900C3F',
                  '#C70039',
                  '#E3611C',
                  '#F1920E',
                  '#FFC300'
                ]
              },
              strokeColorRange: {
                name: 'Global Warming',
                type: 'sequential',
                category: 'Uber',
                colors: [
                  '#5A1846',
                  '#900C3F',
                  '#C70039',
                  '#E3611C',
                  '#F1920E',
                  '#FFC300'
                ]
              },
              radius: 22.5,
              sizeRange: [0, 10],
              radiusRange: [0, 50],
              heightRange: [0, 500],
              elevationScale: 5,
              stroked: true,
              filled: true,
              enable3d: false,
              wireframe: false
            },
            textLabel: [
              {
                field: null,
                color: [255, 255, 255],
                size: 18,
                offset: [0, 0],
                anchor: 'start',
                alignment: 'center'
              }
            ]
          },
          visualChannels: {
            colorField: null,
            colorScale: 'quantile',
            sizeField: null,
            sizeScale: 'linear',
            strokeColorField: null,
            strokeColorScale: 'quantile',
            heightField: null,
            heightScale: 'linear',
            radiusField: null,
            radiusScale: 'linear'
          }
        }
      ],
      interactionConfig: {
        tooltip: {
          fieldsToShow: {
            'custom-read-only': ['prop1', 'prop2']
          },
          enabled: true
        },
        brush: {
          size: 0.5,
          enabled: false
        }
      },
      layerBlending: 'normal'
    }
  }
};

export default config;
