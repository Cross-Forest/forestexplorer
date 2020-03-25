/*
   Copyright 2019, Guillermo Vega-Gorgojo

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var config = {
	// geo widget - Leaflet: http://leafletjs.com/
	geotemplate: 'https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}',
		//'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}',
	geooptions: {
		attribution: 'Forest explorer © <a href="https://forestexplorer.gsic.uva.es/#linkedforest">LinkedForest</a> | Base map © <a href="http://mapbox.com">Mapbox</a>',
		minZoom: 4,
		maxZoom: 24,
		id: 'mapbox/light-v9',//'mapbox.light',
		accessToken: 'pk.eyJ1IjoiZ3VpbGxldmVnYSIsImEiOiJjazE2bW1la2QwZDdrM2pvMjExN21zdHZ1In0.NUl8tlLgN8aZgTwASoH3lA'
	},
	geolocstart: [40.0, -4.0], // localización de España según DBpedia
	
	// config timeout
	timeout: 10000, // timeout por defecto (10s)
	timeoutStep: 2000, // escalón timeout (2s)
	
	// niveles y umbrales zoom
	zParcela: 10,
	zArbol: 18,
	zStart: 7,
	zLugar: 12,
	zCambioRadio: 14,
	
	// sugerencias de especies
	numespsugs: 8,
	
	// SPARQL endpoint
	endpoints: ['http://185.179.104.18:8893/sparql', '/sparql'], // 'http://localhost:8890/sparql'],
	graph: 'http://crossforest.eu', //'https://www.gsic.uva.es/ifn'
	
	// DBPEDIA endpoint
	dbpediaEndpoint: 'https://dbpedia.org/sparql',
	dbpediaGraph: 'http://dbpedia.org',
	
	// solr text engine
	solrPaths: ['/lugares', 'http://localhost:8983/solr/lugares'],
	suggestHandler: '/suggest',
	selectHandler: '/select',
	
	// initial switch values
	initMostrarProvs: true,
	initNomci: false,
	
	// árboles y especies
	especiesTop: ['http://crossforest.eu/ifn/ontology/Class2', 'http://crossforest.eu/ifn/ontology/Class1'],
	treeicon: 'frondosa',
	familyicons: { // incluyo clases, géneros y una especie a mayores
		'http://crossforest.eu/ifn/ontology/Class2': 'conifera',	// Gymnospermae 
		'http://crossforest.eu/ifn/ontology/Class1': 'frondosa',	// Angiospermae
		'http://crossforest.eu/ifn/ontology/Family12': 'fagacea',	// Fagaceae
		'http://crossforest.eu/ifn/ontology/Family16': 'eucalipto',	// Myrtaceae
		'http://crossforest.eu/ifn/ontology/Family13': 'chopo',		// Salicaceae
		'http://crossforest.eu/ifn/ontology/Family19': 'abedul',	// Betulaceae
		'http://crossforest.eu/ifn/ontology/Family22': 'cipres',	// Cupressaceae
		'http://crossforest.eu/ifn/ontology/Family44': 'fresno',	// Oleaceae
		'http://crossforest.eu/ifn/ontology/Family49': 'manzano',	// Rosaceae
		'http://crossforest.eu/ifn/ontology/Family32': 'acebo',		// Aquifoliaceae
		'http://crossforest.eu/ifn/ontology/Family17': 'castindias',// Sapindaceae
		'http://crossforest.eu/ifn/ontology/Family14': 'acacia',	// Leguminosae
		'http://crossforest.eu/ifn/ontology/Family11': 'olmo',		// Ulmaceae
		'http://crossforest.eu/ifn/ontology/Family46': 'platano',	// Platanaceae
		'http://crossforest.eu/ifn/ontology/Family41': 'tilo',		// Malvaceae
		'http://crossforest.eu/ifn/ontology/Family33': 'palmera',	// Arecaceae
		'http://crossforest.eu/ifn/ontology/Genus122': 'haya',		// Fagus
		'http://crossforest.eu/ifn/ontology/Genus123': 'castano',	// Castanea
		'http://crossforest.eu/ifn/ontology/Genus222': 'sabina',	// Juniperus
		'http://crossforest.eu/ifn/ontology/Genus213': 'abeto',		// Abies
		'http://crossforest.eu/ifn/ontology/Genus132': 'sauce',		// Salix
		'http://crossforest.eu/ifn/ontology/Genus442': 'olivo',		// Olea
		'http://crossforest.eu/ifn/ontology/Genus214': 'alerce',	// Larix		
		'http://crossforest.eu/ifn/ontology/Genus216': 'douglas',	// Pseudotsuga		
		'http://crossforest.eu/ifn/ontology/Genus144': 'robinia',	// Robinia
		'http://crossforest.eu/ifn/ontology/Genus215': 'picea',		// Picea		
		'http://crossforest.eu/ifn/ontology/Genus212': 'cedro',		// Cedrus
		'http://crossforest.eu/ifn/ontology/Species21': 'psilv',	// Pinus sylvestris		
		'http://crossforest.eu/ifn/ontology/Species26': 'pinaster',	// Pinus pinaster
		'http://crossforest.eu/ifn/ontology/Species45': 'encina',	// Quercus ilex
		'http://crossforest.eu/ifn/ontology/Species23': 'pinonero',	// Pinus pinea		
	},
	maxspfilters: 4,
	
	// teselas
	maxpatches: 500, // máximo de teselas a cachear (se adapta por dispositivo)
	minpixelspatch: 12, // número mínimo de píxeles para pintar una tesela
	minpixelshole: 10, // número mínimo de píxeles de un agujero en una tesela para pintarlo
	maxareamin: 16000000, // el área mínima no puede ser superior a esto (16M m2)
	maxareaminhole: 10000000, // el área mínima de un agujero no puede ser superior a esto (10M m2)
	
	// parcelas
	radioParcela: 300,
	radioParcelaN0: 5,
	radioParcelaN1: 10,
	radioParcelaN2: 15,
	radioParcelaN3: 25,	
	//ploticon: 'parcela',
	//ploticonInds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
	colplots: [
		['#E8F5E9', '#C8E6C9', '#A5D6A7', '#81C784', '#66BB6A', '#4CAF50', '#43A047', '#388E3C', '#2E7D32', '#1B5E20'],	// VERDE
		['#FAFAFA', '#F5F5F5', '#EEEEEE', '#E0E0E0', '#BDBDBD', '#9E9E9E', '#757575', '#616161', '#424242', '#212121'], // GRIS
		['#ECEFF1', '#CFD8DC', '#B0BEC5', '#90A4AE', '#78909C', '#607D8B', '#546E7A', '#455A64', '#37474F', '#263238'],	// GRIS-AZUL
		['#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726', '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100'],	// NARANJA
		['#E3F2FD', '#BBDEFB', '#90CAF9', '#64B5F6', '#42A5F5', '#2196F3', '#1E88E5', '#1976D2', '#1565C0', '#0D47A1'],	// AZUL		
		// colores contraste
		['#FCE4EC', '#F8BBD0', '#F48FB1', '#F06292', '#EC407A', '#E91E63', '#D81B60', '#C2185B', '#AD1457', '#880E4F'],	// ROSA
		['#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C'],	// VIOLETA	
		['#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0', '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E'],	// INDIGO
		['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA', '#00BCD4', '#00ACC1', '#0097A7', '#00838F', '#006064'],	// CELESTE
		['#EFEBE9', '#D7CCC8', '#BCAAA4', '#A1887F', '#8D6E63', '#795548', '#6D4C41', '#5D4037', '#4E342E', '#3E2723'],	// MARRÓN
	],
	colplotind: 0, // color parcela: verde
	coltesforind: 0, // color tesela forestal: verde
	coltesagrind: 3, // color tesela agrícola: naranja
	coltesimpind: 2, // color tesela improductiva: gris-azul
	colteshumind: 4, // color tesela humedal: azul
	coltesaguind: 4, // color tesela agua: azul	
	colcircplotind: 1, // color círculo plot: gris
	colindefind: 1, // color indefinido: gris
	colespinds: [5, 6, 7, 8, 9], // colores que pueden usarse para analizar especies
	
	// lang
	nolang: "nolang",
	
	// hide elements list
	hidemax: 8,
	hidebegin: 5,
	
	// questionnaire
	interSessionQGap: 1000*3600*24*5, // tiempo mínimo desde primera sesión para mostrar cuestionario (5 días en ms)
	intraSessionQGap: 1000*300, // tiempo mínimo desde primera sesión para mostrar cuestionario (5 minutos en ms)
};
