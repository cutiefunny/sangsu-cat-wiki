/**
 * Copyright 2018 Naver Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var MarkerClustering = function(options) {
    this._map = options.map;
    this._markers = [];
    this._clusters = [];
    this._listeners = {};

    this._maxZoom = options.maxZoom || 13;
    this._minClusterSize = options.minClusterSize || 2;
    this._gridSize = options.gridSize || 100;
    this._icons = options.icons || [];
    this._indexGenerator = options.indexGenerator || [10, 100, 200, 500, 1000];
    this._stylingFunction = options.stylingFunction || function() {};

    this.setMap(this._map);
    this.addMarkers(options.markers);
};

MarkerClustering.prototype = {
    constructor: MarkerClustering,

    addMarkers: function(markers) {
        for (var i = 0, ii = markers.length; i < ii; i++) {
            this._addMarker(markers[i]);
        }
        this._createClusters();
    },

    _addMarker: function(marker) {
        if (marker.getMap()) {
            throw new Error('The marker already has a map.');
        }

        marker.setMap(this._map);
        this._markers.push(marker);
    },

    setMap: function(map) {
        if (this._map) {
            this._clearListeners();
            this._removeClusters();
        }

        this._map = map;

        if (map) {
            this._addListeners();
            this._createClusters();
        }
    },

    getMap: function() {
        return this._map;
    },

    getMarkers: function() {
        return this._markers;
    },

    _addListeners: function() {
        this._listeners.idle = naver.maps.Event.addListener(this._map, 'idle', this._onIdle.bind(this));
    },

    _clearListeners: function() {
        for (var listener in this._listeners) {
            naver.maps.Event.removeListener(this._listeners[listener]);
        }
        this._listeners = {};
    },

    _onIdle: function() {
        this._createClusters();
    },

    _createClusters: function() {
        if (!this._map) return;
        var bounds = this._map.getBounds();
        var zoom = this._map.getZoom();

        this._removeClusters();

        if (zoom > this._maxZoom) {
            for (var i = 0, ii = this._markers.length; i < ii; i++) {
                this._markers[i].setMap(this._map);
            }
            return;
        }

        var clusters = {};

        for (i = 0, ii = this._markers.length; i < ii; i++) {
            var marker = this._markers[i];
            var position = marker.getPosition();

            if (!bounds.hasLatLng(position)) continue;

            var proj = this._map.getProjection();
            var worldCoord = proj.fromCoordToOffset(position);

            var key = this._getGridKey(worldCoord);

            if (!clusters[key]) {
                clusters[key] = [];
            }
            clusters[key].push(marker);
        }

        for (key in clusters) {
            var cluster = clusters[key];
            var center = this._getClusterCenter(cluster);
            var count = cluster.length;
            
            var clusterMarker = new naver.maps.Marker({
                position: this._map.getProjection().fromOffsetToCoord(center),
                map: this._map
            });

            this._updateCluster(clusterMarker, count);

            clusterMarker.set('markers', cluster);
            this._clusters.push(clusterMarker);
        }
    },

    _getGridKey: function(coord) {
        var gridSize = this._gridSize;
        return Math.floor(coord.x / gridSize) + '_' + Math.floor(coord.y / gridSize);
    },

    _getClusterCenter: function(cluster) {
        var x = 0, y = 0, count = cluster.length;

        for (var i = 0; i < count; i++) {
            var position = cluster[i].getPosition();
            var proj = this._map.getProjection();
            var worldCoord = proj.fromCoordToOffset(position);

            x += worldCoord.x;
            y += worldCoord.y;
        }

        return new naver.maps.Point(x / count, y / count);
    },

    _updateCluster: function(clusterMarker, count) {
        var index = this._getClusterIndex(count);
        var icon = this._icons[index];

        clusterMarker.setIcon(icon);
        this._stylingFunction(clusterMarker, count);
    },

    _getClusterIndex: function(count) {
        var index = 0;
        var generator = this._indexGenerator;

        for (var i = 0, ii = generator.length; i < ii; i++) {
            if (count >= generator[i]) {
                index = i + 1;
            }
        }
        return index;
    },

    _removeClusters: function() {
        for (var i = 0, ii = this._clusters.length; i < ii; i++) {
            this._clusters[i].setMap(null);
        }
        this._clusters = [];
        
        for (var i = 0, ii = this._markers.length; i < ii; i++) {
            this._markers[i].setMap(null);
        }
    },
    
    repaint: function() {
        this._createClusters();
    },

    destroy: function() {
        this._clearListeners();
        this._removeClusters();
        
        for (var i = 0, ii = this._markers.length; i < ii; i++) {
            this._markers[i].setMap(null);
        }
        
        this._markers = [];
        this._map = null;
    }
};

if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = MarkerClustering;
}