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

var onturis = {
	// CLASES
	tree: 'http://crossforest.eu/ifn/ontology/Tree',
	plot: 'http://crossforest.eu/ifn/ontology/Plot',
	primaryplot: 'http://crossforest.eu/ifn/ontology/PrimaryPlot',	
	patch: 'http://crossforest.eu/mfe/ontology/Patch',
	province: 'http://crossforest.eu/ifn/ontology/Province',
	
	// CLASES USOS
	use: 'http://crossforest.eu/ifn/ontology/Use',
	forestuse: 'http://crossforest.eu/ifn/ontology/Use100',
	agricuse: 'http://crossforest.eu/ifn/ontology/Use200',
	impruse: 'http://crossforest.eu/ifn/ontology/Use300',
	wetlanduse: 'http://crossforest.eu/ifn/ontology/Use400',
	wateruse: 'http://crossforest.eu/ifn/ontology/Use500',
	usoarb: 'http://crossforest.eu/ifn/ontology/Use110',
	usoarbralo: 'http://crossforest.eu/ifn/ontology/Use120',
	usotempdes: 'http://crossforest.eu/ifn/ontology/Use130',
	usodes: 'http://crossforest.eu/ifn/ontology/Use140',
	usonoveg: 'http://crossforest.eu/ifn/ontology/Use150',
	usofuemonte: 'http://crossforest.eu/ifn/ontology/Use160',
	usoarbdisp: 'http://crossforest.eu/ifn/ontology/Use170',	
	
	// CAPAS
	originalLayer: 'http://crossforest.eu/mfe/data/layer/s5',//'http://crossforest.eu/mfe/data/layer/c_s5',
	mergedLayer: 'http://crossforest.eu/mfe/data/layer/s5s5',//'http://crossforest.eu/mfe/data/layer/c_s5_u2_s5_fixed',
	
	// CRSs
	crs4326: 'http://epsg.w3id.org/data/crs/4326',
	
	// PROPIEDADES
	// posiciones (cambio 3/2/2020)
	prHasPosition: 'http://crossforest.eu/position/ontology/hasPosition',
	prHasCRS: 'http://crossforest.eu/position/ontology/hasCoordinateReferenceSystem',
	prAxis1: 'http://epsg.w3id.org/ontology/axis/1',
	prAxis2: 'http://epsg.w3id.org/ontology/axis/2',	
	
	// provincia
	//prProv: 'http://crossforest.eu/ifn/ontology/isInProvince',
	prProv: 'http://vocab.linkeddata.es/datosabiertos/def/sector-publico/territorio#provincia',
	prBasalArea: 'http://crossforest.eu/ifn/ontology/hasBasalAreaInM2',
	prNumberTrees: 'http://crossforest.eu/ifn/ontology/hasNumberOfTreesInUnits',
	prVolumeWithBark: 'http://crossforest.eu/ifn/ontology/hasVolumeWithBarkInM3',
	
	// parcela
	prBasalAreaPlot: 'http://crossforest.eu/ifn/ontology/hasBasalAreaInM2byHA',
	prNumberTreesPlot: 'http://crossforest.eu/ifn/ontology/hasNumberOfTreesInUnitsByHA',
	prVolumeWithBarkPlot: 'http://crossforest.eu/ifn/ontology/hasVolumeWithBarkInM3byHA',
		
	// especies
	prScientificName: 'http://crossforest.eu/ifn/ontology/hasAcceptedName>/<http://crossforest.eu/ifn/ontology/name',
	prVulgarName: 'http://crossforest.eu/ifn/ontology/vulgarName',
	prWikipediaPage: 'http://crossforest.eu/ifn/ontology/hasWikipediaPage',
	prSameAs: 'http://schema.org/sameAs',
	prWikiredirect: 'http://dbpedia.org/ontology/wikiPageRedirects',
	prComment: 'http://www.w3.org/2000/01/rdf-schema#comment',
	//prAbstract: 'http://dbpedia.org/ontology/abstract',
	prThumbnail: 'http://dbpedia.org/ontology/thumbnail',
	prHasSpeciesIFN: 'http://crossforest.eu/ifn/ontology/hasSpecies',
	
	// árboles
	prInPlot: 'http://crossforest.eu/ifn/ontology/isInPlot',
	prHasHeightInMeters: 'http://crossforest.eu/ifn/ontology/hasTotalHeightInMeters',
	prHasDBH1InMillimeters: 'http://crossforest.eu/ifn/ontology/hasDBH1InMillimeters',
	prHasDBH2InMillimeters: 'http://crossforest.eu/ifn/ontology/hasDBH2InMillimeters',	 // cuidado, hasDBH2nMillimeters en ifn-core (!)
	
	// teselas
	prHasPolygon: 'http://crossforest.eu/position/ontology/hasPolygon',
	prContainsSpecies: 'http://crossforest.eu/mfe/ontology/containsSpecies',
	prContainsSpecies2: 'http://crossforest.eu/ifn/ontology/containsSpecies',
	prHasPercentageOfSpecies: 'http://crossforest.eu/mfe/ontology/hasPercentageOfSpecies',
	prHasSpeciesMFE: 'http://crossforest.eu/mfe/ontology/hasSpecies',
	prCanopyCoverTrees: 'http://crossforest.eu/mfe/ontology/hasCanopyCoverTreesPercent',
	
	// polígonos
	prInLayer: 'http://crossforest.eu/position/ontology/isInLayer',
	prNorth: 'http://epsg.w3id.org/ontology/hasUpperBound106',
	prSouth: 'http://epsg.w3id.org/ontology/hasLowerBound106',
	prWest:	'http://epsg.w3id.org/ontology/hasLeftBound107',
	prEast: 'http://epsg.w3id.org/ontology/hasRightBound107',
	prArea: 'http://crossforest.eu/position/ontology/hasAreaInSquareMeters',	
	prWKT: 'http://www.opengis.net/ont/geosparql#asWKT',
};
