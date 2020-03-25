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

/*******************
*** QUERIES FILE ***
********************/

// query prefixes
var queryPrefixes = {
/*
	'owl': 'http://www.w3.org/2002/07/owl#', 
	'rdf': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#', 
	'xml': 'http://www.w3.org/XML/1998/namespace', 
	'xsd': 'http://www.w3.org/2001/XMLSchema#', */
	'rdfs': 'http://www.w3.org/2000/01/rdf-schema#', /*
	'foaf': 'http://xmlns.com/foaf/0.1/', 
	'skos': 'http://www.w3.org/2004/02/skos/core#', 
	'dc': 'http://purl.org/dc/elements/1.1/',
	'dct': 'http://purl.org/dc/terms/',
	'yago': 'http://dbpedia.org/class/yago/',
	'dbo': 'http://dbpedia.org/ontology/',
	'dbp': 'http://dbpedia.org/property/',
	'prov': 'http://www.w3.org/ns/prov#',
	'bibo': 'http://purl.org/ontology/bibo/',
	'freebase': 'http://rdf.freebase.com/ns/',
	'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
	'geodata': 'http://sws.geonames.org/',
	'georss': 'http://www.georss.org/georss/',	
	'geonames': 'http://www.geonames.org/ontology#',
	'lod': 'http://lod.openlinksw.com/',
	'obo': 'http://www.geneontology.org/formats/oboInOwl#',
	'opencyc': 'http://sw.opencyc.org/concept/',
	'ore': 'http://www.openarchives.org/ore/terms/',
	'schema': 'http://schema.org/',
	'umbel': 'http://umbel.org/umbel#',
	'umbel-ac': 'http://umbel.org/umbel/ac/',
	'umbel-rc': 'http://umbel.org/umbel/rc/',
	'umbel-sc': 'http://umbel.org/umbel/sc/',
	'void': 'http://rdfs.org/ns/void#',
	'wikidata': 'http://www.wikidata.org/entity/',*/
	'geo': 'http://www.w3.org/2003/01/geo/wgs84_pos#',
	'ifn': 'http://crossforest.eu/ifn/ontology/',
	'mfe': 'http://crossforest.eu/mfe/ontology/',
	'spo': 'http://crossforest.eu/position/ontology/',
	'axis': 'http://epsg.w3id.org/ontology/axis/',	
	'epsg': 'http://epsg.w3id.org/ontology/',
	'patch': 'http://crossforest.eu/mfe/data/patch/',
	'poly': 'http://crossforest.eu/mfe/data/polygon/',
	'plot': 'http://crossforest.eu/ifn/data/plot/',
	'tree': 'http://crossforest.eu/ifn/data/tree/',
	'is': 'http://crossforest.eu/ifn/data/infoSpecies/',
	};

// query array with all the queries
var queries = [];

// test endpoint
queries.push({'name': 'test',
	'query': 'SELECT * \n \
WHERE { \n \
	?s ?p ?o . \n \
} LIMIT 1'
});


// PATCHES

// get patches and polygons in a layer with a minimum size in a box
queries.push({'name': 'patchesinbox',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?patch ?poly ?west ?east ?north ?south ?area \n \
WHERE { \n \
	?patch a <'+onturis.patch+'> ; \n \
		<'+onturis.prHasPolygon+'> ?poly . \n \
	?poly <'+onturis.prWest+'> ?west ; \n \
		<'+onturis.prEast+'> ?east ; \n \
		<'+onturis.prNorth+'> ?north ; \n \
		<'+onturis.prSouth+'> ?south ; \n \
		<'+onturis.prArea+'> ?area ; \n \
		<'+onturis.prInLayer+'> <{{{layer}}}> . \n \
	FILTER (?south < {{latnorth}}) . \n \
	FILTER (?north > {{latsouth}}) . \n \
	FILTER (?west < {{lngeast}}) . \n \
	FILTER (?east > {{lngwest}}) . \n \
	FILTER (?area > {{areamin}}) . \n \
} \n \
LIMIT {{limit}} \n \
OFFSET {{offset}}'
});

// get species info of a set of patches (minimum of 0.4% of the area)
queries.push({'name': 'speciespatches',
//		'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?patch ?species ?spperc \n \
WHERE { \n \
	?patch a <'+onturis.patch+'> ; \n \
		<'+onturis.prContainsSpecies+'> ?cs . \n \
	?cs <'+onturis.prHasPercentageOfSpecies+'> ?spperc ; \n \
		<'+onturis.prHasSpeciesMFE+'> ?species . \n \
	FILTER (?patch IN ( {{{fpuris}}} )) . \n \
	FILTER (?spperc > 0.4) . \n \
}'
});


// PLOTS AND TREES
// get positions of plots in a box
/*
queries.push({'name': 'plotsinbox',
//	'prefixes': ['geo', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?plot ?lat ?lng \n \
WHERE { \n \
	?plot a/rdfs:subClassOf* <'+onturis.primaryplot+'> ; \n \
		geo:lat ?lat ; \n \
		geo:long ?lng . \n \
	FILTER (?lat > {{latsouth}}) . \n \
	FILTER (?lat < {{latnorth}}) . \n \
	FILTER (?lng > {{lngwest}}) . \n \
	FILTER (?lng < {{lngeast}}) . \n \
} \n \
LIMIT {{limit}} \n \
OFFSET {{offset}}'
});*/
// cambio 03/02/2020
queries.push({'name': 'plotsinbox',
//	'prefixes': ['geo', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?plot ?lat ?lng \n \
WHERE { \n \
	?plot a/rdfs:subClassOf* <'+onturis.primaryplot+'> ; \n \
		<'+onturis.prHasPosition+'> ?pos . \n \
	?pos <'+onturis.prHasCRS+'> <'+onturis.crs4326+'> ; \n \
		<'+onturis.prAxis1+'> ?lat ; \n \
		<'+onturis.prAxis2+'> ?lng . \n \
	FILTER (?lat > {{latsouth}}) . \n \
	FILTER (?lat < {{latnorth}}) . \n \
	FILTER (?lng > {{lngwest}}) . \n \
	FILTER (?lng < {{lngeast}}) . \n \
} \n \
LIMIT {{limit}} \n \
OFFSET {{offset}}'
});


// get trees with positions in a set of plots
/*
queries.push({'name': 'treesinplots',
//	'prefixes': ['geo', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?tree ?plot ?lat ?lng \n \
WHERE { \n \
	?tree a <'+onturis.tree+'> ; \n \
		geo:lat ?lat ; \n \
		geo:long ?lng ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height ; \n \
		<'+onturis.prInPlot+'> ?plot . \n \
	FILTER (?height > 0) . \n \
	FILTER (?plot IN ( {{{fpuris}}} )) . \n \
}'
});*/
// cambio 03/02/2020
queries.push({'name': 'treesinplots',
//	'prefixes': ['geo', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?tree ?plot ?lat ?lng \n \
WHERE { \n \
	?tree a <'+onturis.tree+'> ; \n \
		<'+onturis.prHasPosition+'> ?pos ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height ; \n \
		<'+onturis.prInPlot+'> ?plot . \n \
	?pos <'+onturis.prHasCRS+'> <'+onturis.crs4326+'> ; \n \
		<'+onturis.prAxis1+'> ?lat ; \n \
		<'+onturis.prAxis2+'> ?lng . \n \
	FILTER (?height > 0) . \n \
	FILTER (?plot IN ( {{{fpuris}}} )) . \n \
}'
});


// get list of plots with the number of trees filtered by species
// (rehecho para obtener todas las especies de árboles de la parcela)
queries.push({'name': 'counttreesplot',
//	'prefixes': ['rdfs', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT ?plot ?species count(distinct ?tree) AS ?ntrees \n \
WHERE { \n \
	?tree a <'+onturis.tree+'>, ?species ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height ; \n \
		<'+onturis.prInPlot+'> ?plot . \n \
	FILTER (?species != <'+onturis.tree+'>) . \n \
	FILTER (?height > 0) . \n \
	FILTER (?plot IN ( {{{fpuris}}} )) . \n \
} \n \
GROUP BY ?plot ?species'
});


// PROVINCES
// get number of plots with a particular species in a province
queries.push({'name': 'countspeciesplotsprov',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT  ?provuri COUNT(distinct ?plot) AS ?nplots \n \
WHERE { \n \
	?plot a/rdfs:subClassOf* <'+onturis.primaryplot+'> ; \n \
		<'+onturis.prProv+'> ?provuri . \n \
{{#suri}} \
	?tree a <'+onturis.tree+'> ; \n \
		a/rdfs:subClassOf* <{{{suri}}}> ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height ; \n \
		<'+onturis.prInPlot+'> ?plot . \n \
	FILTER (?height > 0) . \n \
{{/suri}} \
} \n \
GROUP BY ?provuri'
});

/* Esta consulta da un timeout, la particiono y la cacheo en countallspeciesplotsprov
// get number of plots in a province by species
queries.push({'name': 'countallspeciesplotsprov',
	'prefixes': ['ifn'],
	'query': 'SELECT ?provuri ?spuri COUNT(distinct ?plot) AS ?nplots \n \
WHERE { \n \
	?plot a/rdfs:subClassOf* <'+onturis.primaryplot+'> ; \n \
		<'+onturis.prProv+'> ?provuri . \n \
	VALUES ?spuri { ifn:Class2 ifn:Family21 ifn:Genus211 ifn:Species21 ifn:Species22 ifn:Species23 ifn:Species24 ifn:Species25 ifn:Species26 ifn:Species27 ifn:Species28 ifn:Species29 ifn:Species20 ifn:Genus212 ifn:Species17 ifn:Species217 ifn:Species317 ifn:Species917 ifn:Genus213 ifn:Species31 ifn:Species32 ifn:Genus214 ifn:Species235 ifn:Species35 ifn:Species335 ifn:Species435 ifn:Genus215 ifn:Species33 ifn:Genus216 ifn:Species34 ifn:Family22 ifn:Genus221 ifn:Species236 ifn:Species336 ifn:Species36 ifn:Species436 ifn:Species936 ifn:Genus222 ifn:Species237 ifn:Species238 ifn:Species37 ifn:Species38 ifn:Species39 ifn:Species239 ifn:Species337 ifn:Species937 ifn:Genus223 ifn:Species219 ifn:Genus224 ifn:Species319 ifn:Genus228 ifn:Species18 ifn:Family23 ifn:Genus231 ifn:Species14 ifn:Class1 ifn:Family11 ifn:Genus111 ifn:Species256 ifn:Species356 ifn:Species56 ifn:Species956 ifn:Family12 ifn:Genus121 ifn:Species243 ifn:Species244 ifn:Species40 ifn:Species41 ifn:Species42 ifn:Species43 ifn:Species44 ifn:Species45 ifn:Species46 ifn:Species47 ifn:Species48 ifn:Species49 ifn:Genus122 ifn:Species71 ifn:Genus123 ifn:Species72 ifn:Family13 ifn:Genus131 ifn:Species258 ifn:Species51 ifn:Species52 ifn:Species58 ifn:Genus132 ifn:Species257 ifn:Species357 ifn:Species457 ifn:Species557 ifn:Species57 ifn:Species657 ifn:Species757 ifn:Species857 ifn:Species858 ifn:Species957 ifn:Family14 ifn:Genus141 ifn:Species207 ifn:Species307 ifn:Species7 ifn:Genus142 ifn:Species67 ifn:Genus143 ifn:Species392 ifn:Genus144 ifn:Species92 ifn:Genus145 ifn:Species292 ifn:Family15 ifn:Genus151 ifn:Species268 ifn:Species68 ifn:Genus152 ifn:Species283 ifn:Species83 ifn:Family16 ifn:Genus161 ifn:Species6 ifn:Genus162 ifn:Species264 ifn:Species364 ifn:Species60 ifn:Species61 ifn:Species62 ifn:Species63 ifn:Species64 ifn:Family17 ifn:Genus171 ifn:Species276 ifn:Species376 ifn:Species476 ifn:Species576 ifn:Species676 ifn:Species76 ifn:Species976 ifn:Family18 ifn:Genus181 ifn:Species293 ifn:Species93 ifn:Genus182 ifn:Species96 ifn:Family19 ifn:Genus191 ifn:Species273 ifn:Species373 ifn:Species73 ifn:Genus192 ifn:Species54 ifn:Genus193 ifn:Species98 ifn:Genus194 ifn:Species74 ifn:Family31 ifn:Genus311 ifn:Species297 ifn:Species97 ifn:Species997 ifn:Family32 ifn:Genus321 ifn:Species65 ifn:Species82 ifn:Species282 ifn:Family33 ifn:Genus331 ifn:Species369 ifn:Genus332 ifn:Species469 ifn:Species69 ifn:Family34 ifn:Genus341 ifn:Species569 ifn:Family35 ifn:Genus351 ifn:Species291 ifn:Species91 ifn:Family36 ifn:Genus361 ifn:Species13 ifn:Family37 ifn:Genus371 ifn:Species5 ifn:Family38 ifn:Genus381 ifn:Species9 ifn:Family39 ifn:Genus391 ifn:Species275 ifn:Species75 ifn:Species975 ifn:Family40 ifn:Genus401 ifn:Species88 ifn:Genus402 ifn:Species294 ifn:Species94 ifn:Genus403 ifn:Species87 ifn:Genus404 ifn:Species84 ifn:Family41 ifn:Genus411 ifn:Species277 ifn:Species377 ifn:Species77 ifn:Family42 ifn:Genus421 ifn:Species299 ifn:Genus422 ifn:Species399 ifn:Species499 ifn:Species599 ifn:Family43 ifn:Genus431 ifn:Species81 ifn:Family44 ifn:Genus441 ifn:Species255 ifn:Species355 ifn:Species55 ifn:Species955 ifn:Genus442 ifn:Species66 ifn:Genus443 ifn:Species8 ifn:Genus444 ifn:Species86 ifn:Family45 ifn:Genus451 ifn:Species489 ifn:Family46 ifn:Genus461 ifn:Species79 ifn:Species279 ifn:Family47 ifn:Genus471 ifn:Species1 ifn:Genus472 ifn:Species289 ifn:Family48 ifn:Genus481 ifn:Species3 ifn:Genus482 ifn:Species4 ifn:Species389 ifn:Family49 ifn:Genus491 ifn:Species2 ifn:Genus492 ifn:Species15 ifn:Species215 ifn:Species315 ifn:Species415 ifn:Species515 ifn:Genus493 ifn:Species12 ifn:Genus494 ifn:Species295 ifn:Species395 ifn:Species495 ifn:Species95 ifn:Species595 ifn:Genus495 ifn:Species16 ifn:Genus496 ifn:Species278 ifn:Species378 ifn:Species478 ifn:Species578 ifn:Species78 ifn:Species678 ifn:Species778 ifn:Family50 ifn:Genus501 ifn:Species85 ifn:Family51 ifn:Genus511 ifn:Species11 ifn:Family52 ifn:Genus521 ifn:Species253 ifn:Species53 }
	?tree a <'+onturis.tree+'> ; \n \
		a/rdfs:subClassOf* ?spuri ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height ; \n \
		<'+onturis.prInPlot+'> ?plot . \n \
	FILTER (?height > 0) . \n \
{{/suri}} \
} \n \
GROUP BY ?provuri ?spuri'
});*/

// get number of trees in a province by species
queries.push({'name': 'countallspeciestreesprov',
//	'prefixes': ['rdfs', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT  ?provuri ?spuri COUNT(distinct ?tree) AS ?ntrees \n \
WHERE { \n \
	?plot a/rdfs:subClassOf* <'+onturis.primaryplot+'> ; \n \
		 <'+onturis.prProv+'> ?provuri . \n \
	?tree a <http://crossforest.eu/ifn/ontology/Tree>, ?spuri ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height ; \n \
		<'+onturis.prInPlot+'> ?plot . \n \
		FILTER (?spuri != <'+onturis.tree+'>) . \n \
		FILTER (?height > 0) . \n \
} \n \
GROUP BY ?provuri ?spuri'
});

// get number of trees in a province by species
queries.push({'name': 'infospeciesprov',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT  ?provuri ?ispuri \n \
WHERE { \n \
	?provuri a <'+onturis.province+'> ; \n \
		 <'+onturis.prContainsSpecies2+'> ?ispuri . \n \
}'
});



// SPECIES COUNT

// get list of species with the number of trees
queries.push({'name': 'counttreesspecies',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT ?species (COUNT(DISTINCT ?indiv) AS ?count) \n \
WHERE { \n \
	?indiv a <'+onturis.tree+'> , ?species ; \n \
		<'+onturis.prHasHeightInMeters+'> ?height . \n \
	FILTER (?height > 0) . \n \
	FILTER (?species != <'+onturis.tree+'>) . \n \
} \n \
GROUP BY ?species'
});


// GENERAL

// get subclass relations from a base class
queries.push({'name': 'subclasses',
//	'prefixes': ['rdfs', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?sup ?sub \n \
WHERE { \n \
  ?sup rdfs:subClassOf* <{{{uri}}}> . \n \
  ?sub rdfs:subClassOf ?sup . \n \
}'
});

// get individuals of a class
queries.push({'name': 'indivs',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?uri  \n \
WHERE { \n \
  ?uri a <{{{cluri}}}> . \n \
}'
});

// get direct types of individuals
queries.push({'name': 'types',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?uri ?type  \n \
WHERE { \n \
  ?uri a ?type . \n \
  FILTER (?uri IN ( {{{furis}}} )) }'
});

// get values for properties
queries.push({'name': 'propvalues',
//	'prefixes': ['ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?uri ?value \n \
WHERE { \n \
?uri <{{{propuri}}}> ?value . \n \
FILTER (?uri IN ( {{{furis}}} )) }'
});

// get labels
queries.push({'name': 'labels',
//	'prefixes': ['rdfs', 'ifn', 'mfe', 'epsg', 'patch', 'poly', 'plot', 'tree', 'is'],
	'query': 'SELECT DISTINCT ?uri ?label \n \
WHERE { \n \
?uri rdfs:label ?label . \n \
FILTER (?uri IN ( {{{furis}}} )) }'
});