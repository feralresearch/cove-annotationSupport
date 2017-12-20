/*
annotation_detailpanel.js

Should be called after annotationSupport_detailPanel.js

Assumes this is in the DOM:

<div id="annotation_detail_panel">
	<div id="annotation_detail_panel_content">
		<div class="tabbedContent" tabName="annotation" id="annotation_panel_tab_annotation"></div>
		<div class="tabbedContent" tabName="filters" id="annotation_panel_tab_filters"></div>
	</div>
</div>

*/
AnnotationPanel = function(){}

// Props
AnnotationPanel.prototype.isPanelOpen=false;

// Init
AnnotationPanel.prototype.init = function(){
	// Everything relies on "annotation_support" having been run
	if (typeof annotationsAsHash === 'undefined') {
		console.log('AnnotationDetailPanel: Annotations not found, did you run me before annotationSupport_init.js?');
		return;
	}
	// Configure tabs and make visible
	$("#ap_button_panelToggle").click(function(){annotationPanel.togglePanel()});


	// Build the tabs
	buildTabs();
	this.openTab('Annotations');

	// Start minimized
	this.panelOpen(false);

	// Make visible
	$("#ap_detail_panel").fadeIn("fast");


	function buildTabs(){
		// Init tab headers
		tabSet="";
		$(".ap_tabContent").each(function(){
			var tabName = $(this)[0].getAttribute("tabName");
			tabSet += "<div class='ap_tab' onclick='annotationPanel.openTab(\""+tabName+"\")'>"+tabName+"</div>";
		});
		$("#ap_detail_panel_content").prepend(tabSet);

		// Position the tabs
		var counter=0;
		var indent=2;
		$(".ap_tab").each(function(){
			leftMargin=indent+"rem";
			$(this).css("left",leftMargin);
			indent+=5;
		});
		$(".ap_tab").first().addClass("open");
	}
};

AnnotationPanel.prototype.openTab = function(tabName){
	this.panelOpen(true);
	// Hide tab content
	$(".ap_tabContent").hide();

	// Set up the tabs themselves
	$(".ap_tab").each(function(){
		var thisTabName = $(this).text();
		$(this).removeClass("open");
		if(tabName === thisTabName){
			$(this).addClass("open");
		}
	});

	// Reveal proper tab content
	var selector = 'div[tabName="'+tabName+'"]';
	$(selector).show();
}

AnnotationPanel.prototype.togglePanel = function(){
	this.isPanelOpen=!this.isPanelOpen;
	this.panelOpen(this.isPanelOpen);
}
AnnotationPanel.prototype.panelOpen = function(shouldOpen){
	if(shouldOpen){
		this.isPanelOpen=true;
		$(".ap_tab").show();
		$("#ap_detail_panel").removeClass("ap_detail_panel_minimized");
		$("#ap_button_panelToggle").removeClass("fa-arrow-circle-up");
		$("#ap_button_panelToggle").addClass("fa-arrow-circle-down");

	}else{
		this.isPanelOpen=false;
		$(".ap_tab").hide();
		$("#ap_detail_panel").addClass("ap_detail_panel_minimized");
		$("#ap_button_panelToggle").removeClass("fa-arrow-circle-down");
		$("#ap_button_panelToggle").addClass("fa-arrow-circle-up");
	}
}

// Load a particular annotation into the annotation panel
AnnotationPanel.prototype.loadAnnotation = function(spanID){
	this.panelOpen(true);
	var thisAnnotation = annotationsWithMetadata($("span[spanID='"+spanID+"']").first())[0];

	// Load annotation info into infobar
	var sourceInfo =  "<div class='typeIndicator typeIndicator_"+thisAnnotation.type+"'></div>";
	 	sourceInfo += "<div id='ap_annotation_sourceInfoText'>"+thisAnnotation.typeIdentifierString+"</div>";
	$("#ap_annotation_sourceinfo").empty();
	$("#ap_annotation_sourceinfo").append(sourceInfo);

	// Load source text into detail pane
	var convertLinebreaksToHTML = thisAnnotation.annotation.quote.replace(/(?:\r\n|\r|\n)/g, '<br />');
	$("#ap_annotation_sourcetext").empty();
	$("#ap_annotation_sourcetext").append("&ldquo;"+convertLinebreaksToHTML+"&rdquo;");
	$("#ap_annotation_sourcetext").scrollTop(0);

	// Load annotation into detail pane
	$("#ap_annotation_annotation").empty();
	$("#ap_annotation_annotation").append(thisAnnotation.annotation.text);
	$("#ap_annotation_annotation").scrollTop(0);
}
