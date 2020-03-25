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

/*********************
*** TEMPLATES FILE ***
**********************/		

// TODO: puede rebajarse el padding de la tarjeta con p-3 o incluso p-2, 
// esto permitiría una tarjeta un poco más estrecha (quizá 23rem esté bien en vez de 25rem)

var cardHtml =
	'<div id="tarjeta" class="card-body expandedcard" > \
<!-- ICONO --> \
		<div id="icono_exp" class="d-flex justify-content-between bd-highlight"> \
			<div class="bd-highlight"> \
				<button id ="bot_home" class="btn btn-sm btn-outline-secondary mt-3" type="button" \
						data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttHome)+'"> \
					<i class="fa fa-home"></i> \
				</button> \
			</div> \
			<div class="bd-highlight ml-5 mr-5"> \
				<img class="card-img-top" src="images/'+getLiteral(dict.iconexp)+'" alt="'+getLiteral(dict.title)+'"> \
			</div> \
			<div class="bd-highlight"> \
				<button id ="bot_cont" class="btn btn-sm btn-outline-secondary mt-3" type="button" \
						data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttCollapseForm)+'"> \
					<i class="fa fa-minus"></i> \
				</button> \
			</div> \
		</div> \
		<div id="icono_cont" class="d-none flex-row bd-highlight"> \
			<div class="bd-highlight mr-1"> \
				<img class="card-img-top" src="images/icon.png" alt="'+getLiteral(dict.title)+'"> \
			</div> \
			<div class="d-flex flex-column bd-highlight"> \
				<div class="bd-highlight"> \
					<button id ="bot_exp" class="btn btn-sm btn-outline-secondary" type="button" \
							data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttExpandForm)+'"> \
						<i class="fa fa-plus"></i> \
					</button> \
				</div> \
				<div class="bd-highlight"> \
					<span class="spinner_span ml-2"> \
						<div class="spinner-grow spinner-grow-sm text-secondary" role="status"> \
  							<span class="sr-only">Loading...</span> \
						</div> \
					</span> \
				</div> \
			</div> \
		</div> \
<!-- ESPECIES --> \
		<div id="especies" class="mt-2"> \
			<div id="especies_heading" class="d-flex bd-highlight"> \
				<div class="bd-highlight"> \
					<button id="bot_filtrar_especie" class="btn btn-outline-secondary btn-sm" type="button" disabled  \
							data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttAddSpeciesfilter)+'">'
							+getLiteral(dict.speciesfilter)+'</button> \
				</div> \
				<div class="ml-auto bd-highlight"> \
					<div id="nomci" class="custom-control custom-switch mt-1"> \
						<input type="checkbox" class="custom-control-input" id="switchnomci"> \
						<label class="custom-control-label pt-1" for="switchnomci">'+getLiteral(dict.nomci)+'</label> \
					</div> <!-- /nomci -->  \
				</div> \
			</div> <!-- /especies_heading --> \
			<div id="especies_subheading"></div> \
			<div id="especies_block" class="list-group overflow-auto" style="max-height:40vh;"></div> \
			<div id="filtros_especies" class="mt-1"></div> \
		</div> <!-- /especies --> \
<!-- USOS --> \
		<div id="usos" class="d-none mt-2"> \
			<div id="usos_heading" class="d-flex bd-highlight"> \
				<div class="bd-highlight"> \
					<button id="bot_filtrar_uso" class="btn btn-outline-secondary btn-sm" \
						data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttAddUsefilter)+'" \
						type="button">'+getLiteral(dict.usefilter)+'</button> \
				</div> \
				<div id="info_filtros_uso" class="bd-highlight font-weight-light text-truncate pl-2"></div> \
			</div> \
			<div id="usos_block" class="d-none border overflow-auto p-1" style="max-height:30vh;"></div> \
		</div> <!-- /usos --> \
<!-- LUGARES --> \
		<div id="lugares_heading" class="mt-2 mb-1"> \
			<input id="in_lugares" autocomplete="off" type="search" class="form-control form-control-sm" \
				placeholder="'+getLiteral(dict.searchplace)+'" aria-label="'+getLiteral(dict.searchplace)+'"> \
		</div> <!-- /lugares_heading -->  \
		<div id="sugelugares" class="list-group"></div> \
<!-- SATURACIÓN COLOR --> \
		<div id="colorsat" class="d-none mt-2 mb-1"> \
			<label for="colorsatInputId">'+getLiteral(dict.treesplotcolsat)+':</label> \
			<output id="colorsatOutputId">50</output> \
			<input type="range" class="form-control-range form-sm" id="colorsatInputId" value="50" min="1" max="100" oninput="colorsatOutputId.value = colorsatInputId.value"> \
		</div> <!-- /colorsat --> \
<!-- MOSTRAR PROVINCIAS/PARCELAS Y SPINNER--> \
		<div id="mostrarprovs" class="custom-control custom-switch mt-1"> \
			<span id="spanswitchprovs"> \
				<input id="switchprovs" type="checkbox" class="custom-control-input" checked> \
				<label class="custom-control-label pt-1 text-nowrap" for="switchprovs">'+getLiteral(dict.showprovs)+'</label> \
			</span> \
			<span id="spanswitchplots" class="d-none"> \
				<input id="switchplots" type="checkbox" class="custom-control-input" checked> \
				<label class="custom-control-label pt-1 text-nowrap" for="switchplots">'+getLiteral(dict.showplots)+'</label> \
			</span> \
			<span class="spinner_span mt-1 float-right"> \
				<div class="spinner-grow spinner-grow-sm text-secondary" role="status"> \
  					<span class="sr-only">Loading...</span> \
				</div> \
				<span id="txtspinner"></span> \
			</span> \
		</div> <!-- /mostrarprovs -->  \
<!-- TOSTADA --> \
		<div class="toast d-none mt-1" role="alert" aria-live="assertive" aria-atomic="true" data-delay="10000"> <!-- toast --> \
			<div class="toast-header"> \
				<strong class="mr-auto">'+getLiteral(dict.titleTooManySpecies)+'</strong> \
					<button type="button" class="ml-2 mb-1 close" data-dismiss="toast" aria-label="Close"> \
						<span aria-hidden="true">&times;</span> \
					</button> \
			</div> \
			<div class="toast-body">'+getLiteral(dict.textTooManySpecies)+'</div> \
		</div>	<!-- /toast --> \
	</div> <!-- /card-body -->';
	
/*	
<!-- SATURACIÓN COLOR --> \
		<div id="colorsat" class="d-none mt-2"> \
			<label for="colorsatInputId">'+getLiteral(dict.treesplotcolsat)+':</label> \
			<output id="colorsatOutputId">50</output> \
			<input type="range" class="float-right" id="colorsatInputId" value="50" min="1" max="100" oninput="colorsatOutputId.value = colorsatInputId.value"> \
		</div> <!-- /colorsat --> \		

		<div id="colorsat" class="d-none mt-2"> \
			<div class="d-flex align-content-center bd-highlight"> \
				<div class="bd-highlight flex-grow-1 text-nowrap pr-2"> \
					<label for="colorsatInputId">'+getLiteral(dict.treesplotcolsat)+':</label> \
					<output id="colorsatOutputId">50</output> \
				</div> \
				<div class="bd-highlight"> \
					<input type="range" class="float-right" id="colorsatInputId" value="50" min="1" max="100" oninput="colorsatOutputId.value = colorsatInputId.value"> \
				</div> \
			</div> \	
		</div> <!-- /colorsat --> \		

		
		<div id="colorsat" class="d-none mt-2"> \
			<div class="d-flex bd-highlight"> \
				<div class="bd-highlight flex-grow-1 text-nowrap pr-2"> \
					<label for="colorsatInputId">'+getLiteral(dict.treesplotcolsat)+':</label> \
					<output id="colorsatOutputId">50</output> \
				</div> \
				<div class="bd-highlight"> \
					<input type="range" class="float-right" id="colorsatInputId" value="50" min="1" max="100" oninput="colorsatOutputId.value = colorsatInputId.value"> \
				</div> \
			</div> \	
		</div> <!-- /colorsat --> \			
		
					<div class="d-flex justify-content-between bd-highlight"> \
				<div class="bd-highlight"> \
					<label for="colorsatInputId">'+getLiteral(dict.treesplotcolsat)+':</label> \
					<output id="colorsatOutputId">50</output> \
				</div> \
				<div class="bd-highlight"></div> \
				<div class="bd-highlight"> \
					<input type="range" class="float-right" id="colorsatInputId" value="50" min="1" max="100" oninput="colorsatOutputId.value = colorsatInputId.value"> \
				</div> \
			</div> \		
*/	


// Saturación color parcelas (#árboles/ha)
// Color plot saturation (#trees/ha)

var errorEndpointTemplate =
	'<div class="modal fade" id="errorEndpointModal" tabindex="-1" role="dialog" \
			 aria-labelledby="exampleModalLabel" aria-hidden="true"> \
		<div class="modal-dialog" role="document"> \
			<div class="modal-content"> \
				<div class="modal-header"> \
					<h5 class="modal-title" id="exampleModalLabel">'+getLiteral(dict.errorEndpointTitle)+'</h5> \
					<button type="button" class="close" data-dismiss="modal" aria-label="Close"> \
				  		<span aria-hidden="true">&times;</span> \
					</button> \
				</div> \
				<div class="modal-body"> \
					<p>'+getLiteral(dict.errorEndpointText)+'</p> \
				</div> \
				<div class="modal-footer"> \
			        <button type="button" class="btn btn-secondary" data-dismiss="modal">'+getLiteral(dict.close)+'</button> \
				</div> \
			</div> \
		</div> \
	</div>';


var usosBlockTemplate = 
	'{{#.}} \
		<div class="form-check"> \
			<input uuri="{{{uri}}}" class="form-check-input usoCheck" type="checkbox" value="" id="usoCheck{{ind}}"> \
			<label class="form-check-label" for="usoCheck{{ind}}">{{label}}</label> \
			{{#subusos}} \
				<div class="form-check"> \
					<input uuri="{{{uri}}}" class="form-check-input usoCheck" type="checkbox" value="" id="usoCheck{{ind}}"> \
					<label class="form-check-label" for="usoCheck{{ind}}">{{label}}</label> \
				</div> \
			{{/subusos}} \
		</div> \
	{{/.}}';


var especiesSubheadingTemplate = 
	'{{#activar}} \
		<input id="in_especie" autocomplete="off" type="search" class="form-control form-control-sm mt-1 mb-1" \
			 placeholder="'+getLiteral(dict.searchesp)+'" aria-label="'+getLiteral(dict.searchesp)+'"> \
	{{/activar}} \
	<div id="sugeesps" class="list-group"></div>';


var sugeEspsTemplate = 
	'{{#sugerencias}} \
		<button class="list-group-item list-group-item-action bot_suge_especie" type="button" spuri="{{uri}}"> \
			{{#nc}}<i>{{/nc}}{{{labelshown}}}{{#nc}}</i>{{/nc}}<span class="badge badge-secondary float-right mr-1" data-toggle="tooltip" \
				data-placement="top" title="'+getLiteral(dict.ttSubspecies)+'">{{nclasses}} S</span> \
			<span class="badge badge-secondary float-right mr-1" data-toggle="tooltip" \
				data-placement="top" title="'+getLiteral(dict.ttTrees)+'">{{nindivs}}</span> \
		</button> \
	{{/sugerencias}} \
	{{#nosugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2 bot_suge_especie" disabled>'+getLiteral(dict.noespsfound)+'</button> \
	{{/nosugerencias}}';


var especiesBlockTemplate = 
	'{{#.}} \
		<div class="{{^esconder}}d-flex {{/esconder}}bd-highlight border-bottom border-left border-right especie {{#esconder}}d-none{{/esconder}}" indent="{{indent}}"> \
			{{#botonesconder}} \
				<div><span>{{{indentspace}}}</span><span><button type="button" class="btn btn-outline-secondary btn-sm showmore">'+getLiteral(dict.showmore)+'</button></span></div> \
			{{/botonesconder}} \
			{{^botonesconder}} \
				<div class="flex-grow-1 bd-highlight"> \
					<button class="list-group-item list-group-item-action border-0 bot_especie_filt" type="button" spuri="{{uri}}"> \
						{{{indentspace}}}{{#nc}}<i>{{/nc}}{{label}}{{#nc}}</i>{{/nc}} \
						<span class="badge badge-secondary float-right mr-1" data-toggle="tooltip" \
							data-placement="top" title="'+getLiteral(dict.ttSubspecies)+'">{{nclasses}} S</span> \
						<span class="badge badge-secondary float-right mr-1" data-toggle="tooltip" \
							data-placement="top" title="'+getLiteral(dict.ttTrees)+'">{{nindivs}}</span> \
					</button> \
				</div> \
				<div class="bd-highlight p-1"> \
					<button class="btn btn-outline-secondary btn-sm bot_expandir_especie {{#nosubclasses}}invisible{{/nosubclasses}}" \
						type="button" data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttExpandSpecies)+'"><i class="fa fa-chevron-right"></i> \
					</button> \
				</div> \
			{{/botonesconder}} \
		</div> \
	{{/.}}';

		
var filtroEspeciesTemplate = 
	'{{#.}} \
		<div class="d-flex bd-highlight border" style="background-color: {{color}};"> \
			<div class="bd-highlight pt-2 pl-2">'+getLiteral(dict.filtering)+' <strong>{{#nomci}}<i>{{/nomci}}{{label}}{{#nomci}}</i>{{/nomci}}</strong></div> \
			{{#dbr}} \
				<div class="bd-highlight ml-auto"> \
					<a tabindex="0" class="btn btn-sm text-secondary bot_popover_especie" role="button" \
							spuri="{{{spuri}}}" dbr="{{{dbr}}}" data-toggle="popover" data-placement="top" title="Species info"> \
						<i class="fa fa-info-circle"></i> \
					</a> \
				</div> \
			{{/dbr}} \
			<div class="bd-highlight {{^dbr}}ml-auto{{/dbr}} mr-2" data-toggle="tooltip" \
					 data-placement="top" title="'+getLiteral(dict.ttChangeColor)+'"> \
				<a class="btn btn-sm text-secondary bot_color_filtro" role="button" id="dropdownMenu{{ind}}" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"> \
					<i class="fa fa-tint"></i> \
				</a> \
				<div class="dropdown-menu" aria-labelledby="dropdownMenu{{ind}}"> \
					{{#colores}} \
						<button class="dropdown-item dropdown_color_especie" type="button" ind="{{ind}}" cind="{{cind}}">{{label}}</button> \
					{{/colores}} \
				</div> \
			</div> \
			<div class="bd-highlight bot_quitar_especie_filt pr-2" ind="{{ind}}"> \
				<button type="button" class="close" aria-label="Close" data-toggle="tooltip" data-placement="top" title="'+getLiteral(dict.ttRemoveFilter)+'"> \
					<span aria-hidden="true">&times;</span> \
				</button> \
			</div> \
		</div> \
	{{/.}}';	


var sugeLugaresTemplate = 
	'{{#sugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2 bot_suge_lugar" id="{{id}}">{{{name}}}</button> \
	{{/sugerencias}} \
	{{#nosugerencias}} \
		<button type="button" class="list-group-item list-group-item-action py-2" disabled>'+getLiteral(dict.noplacesfound)+'</button> \
	{{/nosugerencias}}';
	
	
var provTooltipTemplate =
	'<strong>{{prov}}</strong> \
	{{#norows}} \
		<br><i>'+getLiteral(dict.clickzoomin)+'</i> \
	{{/norows}} \
	{{^norows}} \
		{{#notabla}} \
			{{#rows}} \
				<br>{{{head}}}:  {{#els}}{{.}}{{/els}} \
			{{/rows}} \
		{{/notabla}} \
		{{^notabla}} \
			<table class="table table-borderless table-sm m-0"> \
				<thead> \
					<tr> \
						{{#head}} \
							<th scope="col">{{{.}}}</th> \
						{{/head}} \
					</tr> \
				</thead> \
				<tbody> \
					{{#rows}} \
						<tr> \
							<th scope="row">{{{head}}}</th> \
							{{#els}} \
								<td>{{.}}</td> \
							{{/els}} \
						</tr> \
					{{/rows}} \
				</tbody> \
			</table> \
		{{/notabla}} \
	{{/norows}}';


var plotTooltipTemplate =
	'<strong>{{plot}}</strong> \
	{{#prov}} \
		<br>{{prov}} \
	{{/prov}} \
	{{#notabla}} \
		{{#rows}} \
			<br>{{{head}}}:  {{#els}}{{.}}{{/els}} \
		{{/rows}} \
	{{/notabla}} \
	{{^notabla}} \
		<table class="table table-borderless table-sm m-0"> \
			<thead> \
				<tr> \
					{{#head}} \
						<th scope="col">{{{.}}}</th> \
					{{/head}} \
				</tr> \
			</thead> \
			<tbody> \
				{{#rows}} \
					<tr> \
						<th scope="row">{{{head}}}</th> \
						{{#els}} \
							<td>{{.}}</td> \
						{{/els}} \
					</tr> \
				{{/rows}} \
			</tbody> \
		</table> \
	{{/notabla}} \
	{{#hayleyendazomm}} \
		<br><i>'+getLiteral(dict.clickzoomin)+'</i> \
	{{/hayleyendazomm}}';	
	
		
var speciesPopoverTemplate =
	'<div id="dbpedia-card" class="card" style="max-width: 600px;"> \
		{{#imagen}} \
			<div class="row no-gutters"> \
				<div class="col-md-4"> \
					<img class="card-img-top" src="{{{imagen}}}"> \
				</div> \
				<div class="col-md-8"> \
		{{/imagen}} \
					<div class="card-body"> \
						<h5 class="card-title"><i>{{nomci}}</i><br><small class="text-muted">{{tipo}}</small></h5> \
						{{#resumen}} \
							<p class="card-text">{{resumen}}</p> \
						{{/resumen}} \
						{{#wikipage}} \
							<a href="{{{wikipage}}}" target="_blank" \
								class="btn btn-secondary btn-sm">'+getLiteral(dict.wikipage)+'</a> \
						{{/wikipage}} \
					</div> \
		{{#imagen}} \
				</div> \
			</div> \
		{{/imagen}} \
	</div>';


var speciesPopoverSmallWidthTemplate =
	'<div id="dbpedia-card" class="card" style="max-width: 350px;"> \
		{{#imagen}} \
			<img class="card-img-top" src="{{{imagen}}}"> \
		{{/imagen}} \
		<div class="card-body"> \
			<h5 class="card-title"><i>{{nomci}}</i><br><small class="text-muted">{{tipo}}</small></h5> \
			{{#resumen}} \
				<p class="card-text">{{resumen}}</p> \
			{{/resumen}} \
			{{#wikipage}} \
				<a href="{{{wikipage}}}" target="_blank" class="btn btn-secondary btn-sm">'+getLiteral(dict.wikipage)+'</a> \
			{{/wikipage}} \
		</div> \
	</div>';
	
var alertQuestionnaireTemplate = 
	'<div id="questalert" class="alert alert-light ml-3 mb-4 p-2 questalert alert-dismissible fade show" role="alert"> \
		<p class="mb-1">'+getLiteral(dict.questtext)+'</p> \
		<button id="questbotyes" type="button" questurl="'+getLiteral(dict.questurl)+'" class="btn btn-outline-secondary btn-sm">'+getLiteral(dict.yes)+'</button>\
		<button id="questbotno" type="button" class="btn btn-outline-secondary btn-sm">'+getLiteral(dict.no)+'</button>\
		<button id="questbotlater" type="button" class="btn btn-outline-secondary btn-sm">'+getLiteral(dict.later)+'</button>\
	</div>';