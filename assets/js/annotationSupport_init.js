
$("#annotation_detail_panel").hide();

// Init
$( document ).ready(function() {
	// Default
	$( "#annotation_snapshot" ).load('assets/snapshots/goblin_market.html', function(){afterSnapshotLoaded();});
});


// Init: After annotations are loaded
function afterSnapshotLoaded(){
	// Everything relies on "annotations" object, which comes from cove studio snapshot
	if (typeof annotations === 'undefined') {
		console.log('AnnotationTool: No annotations found!');
		return;
	}

	// Convert array to slightly more useful hash by ID
	annotationHash("refresh");

	// Init panel
	// Fixme: should make panel class a singleton instead
	if(typeof annotationPanel === 'undefined'){
		annotationPanel = new AnnotationPanel;
		annotationPanel.init();
	}


	// Categories from filterList
	categoriesByID=[];
	for(idx=0;idx<filterLists.annotation_categories.length;idx++){
		categoriesByID[filterLists.annotation_categories[idx].id]=filterLists.annotation_categories[idx].text;
	}


	// Keep a copy of the background colors at load
	// We also add a unique ID for every span and re-color with some transparency
	// which allows us to see overlaps better.
	annotationColors = [];
	$(".annotator-hl").each(function(index) {
		$(this).attr('spanID', generateUUID);

		// Assumes rgb(r,g,b) converts to rgba(r,g,b,0.6)
		var bgcolor = $(this).css('background-color').split(",");
		var backgroundColorWithOpacityAdjustment = "rgba("+parseInt(bgcolor[0].replace(/\D/g,''))+","
														  +parseInt(bgcolor[1].replace(/\D/g,''))+","
														  +parseInt(bgcolor[2].replace(/\D/g,''))+
														  ",0.6)";
		annotationColors.push(backgroundColorWithOpacityAdjustment);
	});
	resetAnnotationColor();

	// Add click handler
	$(".annotator-hl").click(function() {
  		debounceCollect(this);
	});
}

// Collect all the annotations from a click event
debounceTimer=null;
collectedAnnotations=[];
function debounceCollect(annotation){
	if(debounceTimer == null){
		started=true;
	}
	collectedAnnotations.push(annotation);
	clearTimeout(debounceTimer);
	debounceTimer = setTimeout("debounce_stop()", 10);
}
function debounce_stop(){
	displayPopOverWith(collectedAnnotations);
	debounceTimer=null;
	collectedAnnotations=[];
}

// Takes an array of spans (from onclick) and returns a more useful JSON
function annotationsWithMetadata(spansArray){
	var excerptLength=100;
	var teaserLength=200;
	var data = [];
	for(var idx=0;idx<spansArray.length;idx++){
		var thisAnnotation =[];
		thisAnnotation.spanID = spansArray[idx].getAttribute("spanID");
		thisAnnotation.annotation = annotationHash()[spansArray[idx].getAttribute("data-uuid")];

		var firstRelatedAnnotationSelector = "span[data-uuid='"+spansArray[idx].getAttribute("data-uuid")+"']";
		var firstRelatedAnnotation = $(firstRelatedAnnotationSelector).first();
		thisAnnotation.annotated_text = firstRelatedAnnotation[0].innerText.trim().substring(0,excerptLength);

		thisAnnotation.author_email = thisAnnotation.annotation.user?thisAnnotation.annotation.user:null;
		thisAnnotation.author_username = spansArray[idx].getAttribute("data-username");

		// Create a type identifier string
		var ti;
		// User
		if(thisAnnotation.author_username){
			ti = thisAnnotation.author_username + "("+thisAnnotation.author_email+")";
			thisAnnotation.type="user";

		// Tag
		}else if(thisAnnotation.annotation.tags.length > 0){
			ti="";
			for(var idx2=0;idx2<thisAnnotation.annotation.tags.length;idx2++){
				ti += ("<span class='popover_tag'>"+thisAnnotation.annotation.tags[idx2]+"</span>");
			}
			thisAnnotation.type="tag";

		// Category
		}else if(thisAnnotation.annotation.annotation_categories.length > 0){

			ti="";
			for(var idx2=0;idx2<thisAnnotation.annotation.annotation_categories.length;idx2++){
				ti += ("<span class='popover_category'>"+categoriesByID[thisAnnotation.annotation.annotation_categories[idx2]]+"</span>");
			}
			thisAnnotation.type="category";

		}
		thisAnnotation.typeIdentifierString = ti;

		// Strip tags and linebreaks into teaser
		var annotationText = $("<div>").html(thisAnnotation.annotation.text).text().trim();
		annotationText = annotationText.replace(/(\r\n|\n|\r)/gm,"");
		thisAnnotation.teaser = annotationText.substring(0,teaserLength);
		if(annotationText.length > teaserLength){
			thisAnnotation.teaser += "…";
		}

		data[idx]=thisAnnotation;
	}
	return data;
}

function annotationHash(option){
	if (typeof annotationsAsHash === 'undefined' || option === "refresh") {
		annotationsAsHash=[];
		if (!('uuid' in annotations[0])){
			console.error("AnnotationTool: ERROR Cannot find UUID in annotations, are you using an old snapshot?");
		}
		for(idx=0;idx<annotations.length;idx++){
			thisAnnotation=annotations[idx];
			annotationsAsHash[thisAnnotation.uuid]=thisAnnotation;
		}
	}
	return annotationsAsHash;
}

// Reveal a popover populated with the content
currentPopoverID=null;
currentSelectedSpan=null;
function displayPopOverWith(collectedAnnotations){
$( "#annotation_detail_panel" ).empty();
	var content = "";//"Annotation count: "+collectedAnnotations.length;
	var annotationsUnderThisClick = annotationsWithMetadata(collectedAnnotations);

	var previousText="";
	$.each( annotationsUnderThisClick, function( key, thisAnnotation ) {
			content += "<table spanID='"+thisAnnotation.spanID+"' id='"+thisAnnotation.annotation.uuid+"'>";

			if(thisAnnotation.annotated_text !== previousText){
				content += "<tr>";
				content += "	<td class='popover_annotatedText' colspan=2>&ldquo;…"+thisAnnotation.annotated_text+"…&rdquo;</td>";
				content += "</tr>";
			}
			previousText=thisAnnotation.annotated_text;

			content += "<tr>";
			content += "	<td width=10><div class='typeIndicator typeIndicator_"+thisAnnotation.type+"'></div></td>";
			content += "	<td class='popover_typeIdentifierString'>"+thisAnnotation.typeIdentifierString+"</td>";
			content += "</tr>";
			content += "<tr>";
			content += "	<td class='popover_teaser'colspan=2>"+thisAnnotation.teaser+"</td>";
			content += "</tr>";
			content += "</table>";
	});

	removeExistingPopover();

	// Build a popover
	currentPopoverID=generateUUID();
	currentPopoverDiv='#'+currentPopoverID;
	var popover =
	'<div id="'+currentPopoverID+'" class="popover_wrapper" tabindex="-1">'+
	 	'<div class="push popover_content">'+
	    	content+
	  	'</div>'+
	'</div>';

	// Find the right location
	$('body').append(popover);
	$(currentPopoverDiv).hide();
	var divUnderClick = "span[spanID='"+collectedAnnotations[0].getAttribute("spanID")+"']";
	var topPos = $(divUnderClick).position().top;
	var leftPos = $(divUnderClick).position().left + ($(divUnderClick).width()/2);

	// Move left half of width to center (hardcoded because we can't calculate it while invisible)
	//leftPos -= 60;
	var allRelatedAnnotation = "span[data-uuid='"+collectedAnnotations[0].getAttribute("data-uuid")+"']";
	$(allRelatedAnnotation).addClass("annotationSelected");
	$(divUnderClick).addClass("annotationSelectedExact");
	currentSelectedSpan=$(allRelatedAnnotation);

	// Display
	$(currentPopoverDiv).on( "focusout", function(){removeExistingPopover();});
	$(currentPopoverDiv).css({top: topPos, left: leftPos, position:'absolute'}).fadeIn("fast");
	$(currentPopoverDiv).focus();

	// Add click linked
	$("table").each(function(index) {
		$(this).on( "click", function(){
			removeExistingPopover();
			annotationPanel.loadAnnotation($(this)[0].getAttribute("spanID"));
		});
	});

}

function removeExistingPopover(){
	if(currentPopoverID != null){
		var currentPopoverDiv='#'+currentPopoverID;
		$("span").removeClass("annotationSelected");
		$("span").removeClass("annotationSelectedExact");
		$(currentPopoverDiv).fadeOut("fast", function(){});
	}
}

$( window ).resize(function() {
  removeExistingPopover();
});


densityView=false;
function toggleDensity(){
	if(densityView){
		$(".annotator-hl").each(function(index) {
			$(this).css("background-color", "rgba(64,64,64,.3)");
		});
	}else{
		resetAnnotationColor();
	}
	densityView=!densityView;
}

function changeSnapshot(){
	removeExistingPopover();
	var selectBox = document.getElementById("annotation_snapshotSelector");
	var selectedValue = selectBox.options[selectBox.selectedIndex].value;
	$( "#annotation_snapshot" ).load(selectedValue, function(){afterSnapshotLoaded();});
}

// Eugene Burtsev
// https://github.com/eburtsev/jquery-uuid
function generateUUID() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0,
			v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});
}


// Resets the annotations to their original colors
function resetAnnotationColor() {
	idx = 0;
	$(".annotator-hl").each(function(index) {
		$(this).css("background-color", annotationColors[idx]);
		idx++;
	});
}
