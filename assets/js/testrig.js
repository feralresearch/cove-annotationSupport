
// Init
$( document ).ready(function() {

	// Init dropdown with snapshots
	var data = {
	    'assets/snapshots/goblin_market.html': 'Goblin Market',
	    'assets/snapshots/harlots_house.html':'Harlots House',
		'assets/snapshots/heart_of_darkness_part1.html':'Heart of Darkness I',
		'assets/snapshots/in_an_artists_studio.html':'In An Artists Studio'
	}
	var selector = $('#annotation_snapshotSelector');
	for(var val in data) {
	    $('<option  />', {value: val, text: data[val]}).appendTo(selector);
	}
	selector.appendTo('#annotation_snapshotSelector_container'); // or wherever it should be


	// Actuall realated to annotations
	$( "#annotation_snapshot" ).load('assets/snapshots/goblin_market.html', function(){afterAnnotationsLoaded();});
});


// Init: After annotations are loaded
function afterAnnotationsLoaded(){

	// Keep a copy of the background colors at load
	// Add a unique ID
	annotationColors = [];
	$(".annotator-hl").each(function(index) {
		$(this).attr('uniqueID', generateUUID);
		annotationColors.push($(this).css('background-color'));
	});

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

// Reveal a popover populated with the content
currentPopoverID=null;
currentSelectedSpan=null;
function displayPopOverWith(collectedAnnotations){

	removeExistingPopover();

	// Build a popover
	currentPopoverID=generateUUID();
	currentPopoverDiv='#'+currentPopoverID;
	var content = "Annotation count: "+collectedAnnotations.length;
	var popover =
	'<div id="'+currentPopoverID+'" class="popover_wrapper">'+
	 	'<div class="push popover_content">'+
	    	'<p class="popover_message">'+content+'</p>'+
	  	'</div>'+
	'</div>';

	// Find the right location
	$('body').append(popover);
	$(currentPopoverDiv).hide();
	var uniqueid = collectedAnnotations[0].getAttribute("uniqueid");
	var selector = "span[uniqueid='"+uniqueid+"']";
	var topPos = $(selector).offset().top;
	var leftPos = $(selector).position().left + ($(selector).width()/2);

	// Move left half of width to center (can't calculate while invisible)
	leftPos -= 60;

	$(selector).addClass("annotationSelected");
	currentSelectedSpan=$(selector);

	// Display
	$(currentPopoverDiv).css({top: topPos, left: leftPos, position:'absolute'}).fadeIn("fast");
}

function removeExistingPopover(){
	if(currentPopoverID != null){
		var currentPopoverDiv='#'+currentPopoverID;
		var selector = "span[uniqueid='"+currentPopoverID+"']";
		currentSelectedSpan.removeClass("annotationSelected");
		$(currentPopoverDiv).fadeOut("fast");
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
	$( "#annotation_snapshot" ).load(selectedValue, function(){afterAnnotationsLoaded();});
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
