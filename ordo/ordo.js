define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/events',
    'base/js/dialog',
    'notebook/js/celltoolbar'
],  function(
    require,
    $,
    Jupyter,
    events,
    dialog,
    celltoolbar
) {

    console.debug("...Ordo loaded... grading capabilities initiated");

    var CellToolbar = celltoolbar.CellToolbar;
    
    var defaultSuccess = "";
    var defaultFailure = "";

    /* Taken from https://github.com/ipython-contrib/jupyter_contrib_nbextensions/issues/664 */
    /* 
    var all_events = [
        'app_initialized.DashboardApp',
        'app_initialized.NotebookApp',
        'autosave_disabled.Notebook',
        'autosave_enabled.Notebook',
        'before_save.Notebook',
        'changed',
        'checkpoint_created.Notebook',
        'checkpoint_delete_failed.Notebook',
        'checkpoint_deleted.Notebook',
        'checkpoint_failed.Notebook',
        'checkpoint_restore_failed.Notebook',
        'checkpoint_restored.Notebook',
        'checkpoints_listed.Notebook',
        'collapse_pager',
        'command_mode.Cell',
        'command_mode.Notebook',
        'config_changed.Editor',
        'create.Cell',
        'delete.Cell',
        'draw_notebook_list.NotebookList',
        'edit_mode.Cell',
        'edit_mode.Notebook',
        'execute.CodeCell',
	'finished_execute.CodeCell',
        'execution_request.Kernel',
        'expand_pager',
        'file_load_failed.Editor',
        'file_loaded.Editor',
        'file_renamed.Editor',
        'file_saved.Editor',
        'file_saving.Editor',
        'input_reply.Kernel',
        'kernel_autorestarting.Kernel',
        'kernel_busy.Kernel',
        'kernel_connected.Kernel',
        'kernel_connection_dead.Kernel',
        'kernel_connection_failed.Kernel',
        'kernel_created.Kernel',
        'kernel_created.Session',
        'kernel_dead.Kernel',
        'kernel_dead.Session',
        'kernel_disconnected.Kernel',
        'kernel_idle.Kernel',
        'kernel_interrupting.Kernel',
        'kernel_killed.Kernel',
        'kernel_killed.Session',
        'kernel_ready.Kernel',
        'kernel_reconnecting.Kernel',
        'kernel_restarting.Kernel',
        'kernel_starting.Kernel',
        'kernelspecs_loaded.KernelSpec',
        'list_checkpoints_failed.Notebook',
        'mode_changed.Editor',
        'no_kernel.Kernel',
        'notebook_copy_failed',
        'notebook_deleted.NotebookList',
        'notebook_load_failed.Notebook',
        'notebook_loaded.Notebook',
        'notebook_loading.Notebook',
        'notebook_read_only.Notebook',
        'notebook_renamed.Notebook',
        'notebook_restoring.Notebook',
        'notebook_save_failed.Notebook',
        'notebook_saved.Notebook',
        'open_with_text.Pager',
        'output_appended.OutputArea',
        'preset_activated.CellToolbar',
        'preset_added.CellToolbar',
        'rebuild.QuickHelp',
        'received_unsolicited_message.Kernel',
        'rendered.MarkdownCell',
        'resize',
        'resize-header.Page',
        'save_status_clean.Editor',
        'save_status_dirty.Editor',
        'select.Cell',
        'selected_cell_type_changed.Notebook',
        'send_input_reply.Kernel',
        'sessions_loaded.Dashboard',
        'set_dirty.Notebook',
        'set_next_input.Notebook',
        'shell_reply.Kernel',
        'spec_changed.Kernel',
        'spec_match_found.Kernel',
        'spec_not_found.Kernel',
        'trust_changed.Notebook',
        'unrecognized_cell.Cell',
        'unrecognized_output.OutputArea',
        'unregistered_preset.CellToolbar',
    ];

    
    events.on(all_events.join(' '), function (evt, data) {
        console.debug('[evt]', evt.type, (new Date()).toISOString(), data);
    });
    */

    var params = {
        defaultSuccess     : "",
	defaultFailure     : "",
	enableModeToggle   : true
    };
    
    var initialize = function () {
	
        $('<link/>')
            .attr({
                rel: 'stylesheet',
                type: 'text/css',
                href: require.toUrl('./ordo.css')
            })
            .appendTo('head');

	events.on("notebook_loaded.Notebook", function() {
	    initializeCells()
	});
        if (Jupyter.notebook !== undefined && Jupyter.notebook._fully_loaded) {
            initializeCells();
        }
	
	
	ordoFeedback();
	makeOutputButton();
	showSolutionButton();
	editMetadataButtons();

	if (params.enableModeToggle) {

	    /* TODO: Remove toggle button, eventually */
	    
	    ordoEditFeedbackToggle();

	    CellToolbar.register_callback('create_tutorial.toolbar', createCellToolbar);
	    
            var preset = [
		'create_tutorial.toolbar'
            ];
	    
            CellToolbar.register_preset('Create Tutorial', preset, Jupyter.notebook);
	}

    };

    var onClickAdmonitionButton = function(cell, btn) {
	if (btn.hasClass('active')) {
	    console.debug("Close ...");
	    cell.element.find('div.ordo-admonition-controls').nextAll().hide();
	    btn.text('Open');
	} else {
	    cell.element.find('div.ordo-admonition-controls').nextAll().show()
	    btn.text('Close');
	}
	console.debug(btn);
    };

    var toggleOpenButton = function(cell) {
	console.debug("toggleOpenButton");
	console.debug(cell);
	if (cell.metadata.ordo !== undefined &&
	    cell.metadata.ordo.admonition !== undefined &&
	    cell.metadata.ordo.admonition) {
	    var localDiv = $('<div />').addClass("text-center").addClass('ordo-admonition-controls');
            var btn = $('<button />');
	    btn.addClass('btn btn-sm btn-primary ordo-admonition-btn').attr('data-toggle', 'button');
	    
	    if (params.enableModeToggle) {
		btn.addClass('active').attr('aria-pressed', true);
		cell.element.find('div.ordo-admonition-controls').nextAll().show();
		btn.text('Close');
	    } else {
		btn.attr('aria-pressed', false)
		cell.element.find('div.ordo-admonition-controls').nextAll().hide();
		btn.text('Open');
	    }

	    btn.click(function() { onClickAdmonitionButton(cell,$(this)) });
	    
	    cell.element.prepend(localDiv.append(btn));
	} else {
	    cell.element.find('div.ordo-admonition-controls').remove();
	}
    }

    var createCellToolbar = function (div, cell, celltoolbar) {

	var localDiv = $('<div />').addClass('ordo-celltoolbar');

	/* Authoring */

	if (cell.cell_type === null) {
	    events.on('create.Cell', (event, data) => {
		events.off(event);
		createCellToolbar(div, cell, celltoolbar)
	    });
	} else {

	    if (cell.cell_type === 'code') {
		var editSolBtn = $('<button />').addClass('btn btn-sm btn-secondary').text('Edit solutions').click((evt) => onEditSol(cell));
		var editSuccBtn = $('<button />').addClass('btn btn-sm btn-secondary').text('Edit success message').click((evt) => onEditSuccMsg(cell));
		var editFailBtn = $('<button />').addClass('btn btn-sm btn-secondary').text('Edit failure message').click((evt) => onEditFailMsg(cell));;
		var authGrp = $('<div/>').addClass('btn-group').
		    attr('role', 'group').
		    attr('aria-label', 'Buttons for authoring cell solutions');
		authGrp.append(editSolBtn).append(editSuccBtn).append(editFailBtn);
		localDiv.append(authGrp);
	    }


	/* Admonition */
	var adm = $('<button />');

	adm.addClass('btn btn-sm btn-secondary').attr('data-toggle', 'button').attr('aria-pressed', false)
	    .text('Make admonition');

	if (cell.metadata.ordo !== undefined &&
	    cell.metadata.ordo.admonition !== undefined &&
	    cell.metadata.ordo.admonition) {
	    adm.addClass('active').attr('aria-pressed', true);
	}
     
        adm.click(() => {
	    
	    if (cell.metadata.ordo === undefined) {
		cell.metadata.ordo = {};
	    }
	    
	    if (cell.metadata.ordo.admonition === undefined) {
		cell.metadata.ordo.admonition = true;
		cell.element.addClass('ordo-admonition-on');
	    } else {
		delete cell.metadata.ordo.admonition;
		cell.element.removeClass('ordo-admonition-on');
	    }

	    toggleOpenButton(cell);
	    
	});

            $(div).append(localDiv.append(adm));
	}
    };

    var initializeCells = function() {
	console.log(Jupyter.notebook.get_cells());
	Jupyter.notebook.get_cells().forEach(function (cell, idx, cells) {
	    console.debug("initializeCells");
	    console.debug(cell.metadata);
	    toggleOpenButton(cell);
	});
    }

    /**
     * reads configuration properties containing default feedback responses for the plugin
     */
    var readConfig = function() {
	
	$.extend(true, params, Jupyter.notebook.config.data.ordo);
	console.debug(params);

	/* FIXME: for the time being, set old variables */
	defaultFailure = params['defaultFailure'];
	defaultSuccess = params['defaultSuccess'];
	
    };
    
    var executePython = function(python) {
	console.debug("define: ", python);

	return (new Promise((resolve, reject) => {
	    console.debug("1. executePython: " + python);
	    Jupyter.notebook.kernel.execute(python, {
		iopub: { output: (msg) => {
		    console.debug("CALLBACK: ", msg);
		    /* TODO: Fix for error cases, check for status == error etc. */
		    if (msg.msg_type === 'execute_result') {
			console.debug("CALLBACK (result): ", solutionToString(msg.content.data));
			resolve(msg.content.data)
		    }
		}}}, { silent: false });
	})).then((result) => { console.debug("2. executePython" + result); return result; });
    }



    /**
     *  Capture output_appended.OutputArea event for the result value
     *  Capture finished_execute.CodeCell event for the data value
     *  check for a solution in cell metadata
     *  if exists:
     *    check only one area appended (ends recursion)
     *    if true:
     *      check result against solution
     *      if result correct:
     *        append the success message
     *      if result incorrect:
     *        append the failure message
     */
    
    var onCodeCellExecuted = async function(evt, obj) {
	outputs = obj.cell.output_area.outputs;
	solution = obj.cell.metadata.ordo_solution;
	if (solution !== undefined) {
	    console.debug("ordo feedback ?", obj.cell.element.find('.output_area'));

	    if (obj.cell.metadata.ordo_verify === undefined) {
		var res;
		if (solution['python'] !== undefined) {
		    console.debug("executePython AWAIT ", solution);
		    
		    res = await executePython(solution["python"]).then((result) => { console.debug("3. executePython", result); return result })
		    obj.cell.metadata.ordo_solution = {...obj.cell.metadata.ordo_solution, ...res};
		     
		    
		} else {
		    res = solution;
		}
		console.debug("executePython SOL xxxxx: ", res, outputs, outputs[outputs.length-1]);
		feedback = ordoFeedbackMessage(equals(res, outputs[outputs.length-1].data),
					       obj.cell.metadata.ordo_success, 
					       obj.cell.metadata.ordo_failure);
	    } else {
		if(solution['python'] != undefined) {
		    console.debug("executePython AWAIT ",  solution);
		    
		    solution = await executePython(solution["python"]).then((result) => console.debug("3. executePython2" + result))
		} 
		
		console.debug("executePython SOL 2 ", solution);
		feedback = obj.cell.metadata.ordo_verify(outputs[outputs.length-1].data, 
							 obj.cell.metadata.ordo_success, 
							 obj.cell.metadata.ordo_failure);
	    }
	    obj.cell.output_area.append_output({
		"output_type" : "display_data",
		"data" : {
		    "text/html": feedback
		},
		"metadata" : {}
	    });
	}
    };
        
    var ordoFeedback = function () {
	events.on('finished_execute.CodeCell', onCodeCellExecuted);
    }

	/**
	 * returns the div containing the 
	 * @param {boolean} correct - if the submitted solutions was correct or not
	 * @param {string} success_msg - the success message for the current cell, if defined
	 * @param {string} failure_msg - the failure message for the current cell, if defined 
	 */
	var ordoFeedbackMessage =  function(correct,success_msg,failure_msg) {
		if(correct) {
			if (success_msg == undefined && defaultSuccess == "") {
				feedback = "<div class='alert alert-success alert-dismissible ordo_feedback' role='alert'> " + 
						   "<button type='button' class='close' data-dismiss='alert'>&times;</button> " + 
						   "<strong>Well Done!</strong> That was the correct response. " + 
						   " </div>"
			} else if (success_msg == undefined && defaultSuccess) {
				feedback = "<div class='alert alert-success alert-dismissible ordo_feedback' role='alert'> " + 
						   "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + 
						   defaultSuccess + 
						   "</div>"
			} else {
				feedback = "<div class='alert alert-success alert-dismissible ordo_feedback' role='alert'> " + 
						   "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + 
						   success_msg + 
						   "</div>"
			}
		} else {
			if (failure_msg == undefined) {
				feedback = "<div class='alert alert-danger alert-dismissible ordo_feedback' role='alert'> " + 
						   "<button type='button' class='close' data-dismiss='alert'>&times;</button> " + 
						   "<strong>Oh no!</strong> That wasn't quite right. " + 
						   "</div>"
			} else if (failure_msg == undefined && defaultFailure) {
				feedback = "<div class='alert alert-danger alert-dismissible ordo_feedback' role='alert'> " +
						   "<button type='button' class='close' data-dismiss='alert'>&times;</button>" +
						   defaultFailure + 
						   "</div>"
			} else {
				feedback = "<div class='alert alert-danger alert-dismissible ordo_feedback' role='alert'>" + 
						   "<button type='button' class='close' data-dismiss='alert'>&times;</button>" + 
						   failure_msg  + 
						   "</div>"
			}
		}
		return feedback;
	}

	/**
	 * tests two metadata objects for equality
	 * @param {Object} obj1 
	 * @param {Object} obj2 
	 */
	var equals = function(obj1, obj2) {
		for(var p in obj1){
			if(obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;
			switch(typeof(obj1[p])) {
				case 'object':
					if(!equals(obj1[p],obj2[p])) return false;
					break;
				case 'function':
					if(typeof(obj2[p]) == undefined || (p != equals && obj1[p].toString() != obj2[p].toString())) return false;
					break;
				default:
					if(obj1[p] != obj2[p]) return false;
			}
		}
		for(var p in obj2) {
			if(typeof(obj1[p]) == undefined) return false;
		}
		return true;
	}
	/** 
	 *  Capture select cell event for the cell data
	 *  check cell type is code
	 *  if true:
	 *    check the cell is the same as the formerly selected cell
	 *    if true:
	 *      return with no action
	 *    if false:
	 *      Remove the button from the formerly selected cell
	 *      check if the cell has been run already
	 *      if true:
	 *        append a button for the user to click which will:
	 *        make ordo_solution = output_area.outputs[0]
	 */
	var makeOutputButton = function () {
		var currCell = undefined;
		events.on('select.Cell', function(event, data) {
			newCell = data.cell;
			if(newCell == currCell){
				return;
			} else if($('.ordo_edit_mode').length == 0) {
				return;
			} else {
				$(".show-ordo-solution").remove();
				$(".make-ordo-solution").remove();
				currCell = newCell;
				if(currCell.cell_type == "code") {
					if(currCell.output_area.outputs.length > 0){
						if(currCell.output_area.outputs[0].output_type == "execute_result") {
							$(".selected .output_area")
							.first()
							.append("<button type='button' class='btn btn-primary make-ordo-solution'>make solution</button>");
							$(".make-ordo-solution").on("click", function() {
								console.debug("updated metadata");
								currCell.metadata.ordo_solution = currCell.output_area.outputs[0].data;
							});
						}
					}
				}
			}
		}); 
	}

	/**
	 * @param {Object} solution - 
	 * returns the correct solution in the appropriate format
	 */
	var solutionToString = function (solution) {
		var outStr = "";
		console.debug(solution)	
		for (var key in solution) {
			switch (key){
				case 'text/html':
					outStr = solution[key];
					break;
				case 'text/plain':
					outStr = solution[key];
					break;
				case 'python':
					outStr = solution[key];
					break;
				default:
					outStr = 'N/A';
			}
		}
	    console.debug(outStr);
	    return outStr;
	}

    	var solutionToString = function (solution) {
	    var outStr = "";
	    var mimeTypes = Object.keys(solution);
	    console.debug("mimeTypes", mimeTypes);
	    /* TODO: change to "text/x-..." later */
	    if (mimeTypes.includes("python")) {
		outStr = solution["python"];
	    } else {
		for (var mt of mimeTypes) {
		    console.debug("mt", mt);
		    switch (mt) {
		    case "text/html":
			outStr = solution[mt];
			break;
		    case "text/plain":
			outStr = solution[mt];
			break;
		    default:
			outStr = null;
		    }
		}
	    }
	    console.debug(outStr);
	    return outStr;
	}

	/**
	 * 
	 * creates a button to show the current solution to the user
	 */
	var showSolutionButton = function () {
		var currCell = undefined;
		events.on('select.Cell', function(event, data) {
			newCell = data.cell;
			if(newCell == currCell){
				return;
			} else if($('.ordo_feedback_mode').length == 0) {
				return;
			} else {
				$(".show-ordo-solution").remove();
				currCell = newCell;
				if(currCell.cell_type === "code" && currCell.metadata && currCell.metadata.ordo_solution) {
				    if(currCell.output_area.outputs.length > 0) {
					console.debug("Show solution button");
					console.debug(currCell.output_area.outputs[0].output_type);
					if(["execute_result", "stream"].includes(currCell.output_area.outputs[0].output_type)) {
					    $(".selected .input")
						.after("<div style='text-align: right;'><button type='button' class='btn fa fa-eye show-ordo-solution'></button></div>");
					    $(".show-ordo-solution").one("click", function() {
						//currCell.metadata.ordo_solution = currCell.output_area.outputs[0].data;
						// solution = solutionToString(currCell.metadata.ordo_solution)
						console.debug(currCell.metadata.ordo_solution);

						/* TODO: 
						  * - Improve retrieval here based on a parametric solutionToString 
						  * - Make sure that we escape text/plain content here, as feedback requires markup!
						  */
						
						solution = currCell.metadata.ordo_solution['text/plain']
						console.debug("Current solution => " + solution);
						feedback = "<div class='alert alert-info alert-dismissible show-ordo-solution' role='alert'>" + 
						    "<button type='button' class='close' data-dismiss='alert'>&times;</button> " + 
						    "<stron> Expected solution is: </strong>" + solution  + " </div>"
						currCell.output_area.append_output({
						    "output_type" : "display_data",
						    "data" : {
							"text/html": feedback
						    },
						    "metadata" : {}
						});
					    });
					}
					}
				}
			}
		}); 
	}
    
    /**
	 * sets the solution for the current cell to be the solution for all cells in the notebook
	 */
	var allOutputsButton = function() {
		var myFunc = function () {
			cells = Jupyter.notebook.get_cells();
			for(i=0;i < cells.length;i++) {
				if(cells[i].cell_type == "code") {
					if(cells[i].output_area != undefined) {
						if(cells[i].output_area.outputs.length > 0) {
							if(cells[i].output_area.outputs[0].output_type == "execute_result") {
								cells[i].metadata.ordo_solution = cells[i].output_area.outputs[0].data
								console.debug("updated metadata");
							}
						}
					}
				}
			}
		};
		var action = {
			icon: 'fa-lightbulb-o',
			help: 'Make all outputs solutions',
			help_index: 'zz',
			handler: myFunc
		};
		var prefix = 'allOutputsButton';
		var action_name = 'show-button';
		var full_action_name = Jupyter.actions.register(action, action_name,prefix);
		if($("[data-jupyter-action*='allOutputsButton']").length == 0) {
			Jupyter.toolbar.add_buttons_group([full_action_name]);
		}
	}

	/**
	 * toggles the cell mode between editing/creating solutions and giving feedback
	 */
	var ordoEditFeedbackToggle = function() {
		var editMode = function() {
			$('.command_mode').removeClass('ordo_feedback_mode');
			$('.command_mode').addClass('ordo_edit_mode');
			$("[data-jupyter-action*='feedbackToggle']").removeClass('active');
			$("[data-jupyter-action*='editModeToggle']").addClass('active');
			makeOutputButton();
			allOutputsButton();
		};
		var eMaction = {
			icon: 'fa-pencil',
			help: 'Enter ordo-edit mode',
			help_index: 'zy',
			handler: editMode
		};
		var eMprefix = 'editModeToggle';
		var eMaction_name = 'EnterEditMode';
		var eM_action_name = Jupyter.actions.register(eMaction, eMaction_name, eMprefix);

		var feedbackMode = function() {
			$('.command_mode').removeClass('ordo_edit_mode');
			$('.command_mode').addClass('ordo_feedback_mode');
			$("[data-jupyter-action*='editModeToggle']").removeClass('active');
			$("[data-jupyter-action*='feedbackToggle']").addClass('active');
			$("[data-jupyter-action*='allOutputsButton']").remove();
			$(".make-ordo-solution").remove();
			$(".ordo-user-input").remove();
		};
		var fMaction = {
			icon: 'fa-check',
			help: 'Enter feedback-only mode',
			help_index: 'zx',
			handler: feedbackMode
		};
		var fMprefix = 'feedbackToggle';
		var fMaction_name = 'EnterFeedbackMode';
		var fM_action_name = Jupyter.actions.register(fMaction, fMaction_name, fMprefix);

	    /* Jupyter.toolbar.add_buttons_group([fM_action_name,eM_action_name]) */
	    		var eMaction = {
			icon: 'fa-pencil',
			help: 'Enter ordo-edit mode',
			help_index: 'zy',
			handler: editMode
		};
		var eMprefix = 'editModeToggle';
		var eMaction_name = 'EnterEditMode';
		var eM_action_name = Jupyter.actions.register(eMaction, eMaction_name, eMprefix);

		var toggleAdmonitions = function() {
		    var r = $("[data-jupyter-action*='toggleAdmonitions']").toggleClass('active');
		    console.debug("toggleAdmonitions 'em!!!!");
		    
		    Jupyter.notebook.get_cells().
			forEach(function (cell, idx, cells) {
			    var elem;
			    if (r.hasClass('active')) {
				elem = cell.element.find("div.ordo-admonition-controls button.ordo-admonition-btn.active");
			    } else {
				elem = cell.element.find("div.ordo-admonition-controls :not(button.ordo-admonition-btn.active)");
			    }
			    
			    if (elem.length > 0) {
				onClickAdmonitionButton(cell, elem);
				elem.toggleClass("active");
			    }
			});
		};

	    var admAction = {
		icon: 'fa-window-close-o',
		help: 'Open/ close all admonitions cells',
		help_index: 'zz',
		handler: toggleAdmonitions
	    };

	    var admPrefix = 'toggleAdmonitions';
	    var admAction_name = 'OpenCloseAdmonitions';
	    var adm_action_name = Jupyter.actions.register(admAction, admAction_name, admPrefix);
	    
	    Jupyter.toolbar.add_buttons_group([fM_action_name,eM_action_name,adm_action_name])

	    $('.command_mode').addClass('ordo_feedback_mode');
	    $("[data-jupyter-action*='feedbackToggle']").addClass('active');

	}

    var onEditSol = function(cell) {
	dialog.modal({
	    'title': 'Edit Solutions',
	    'body': makeSolutionInputArea(cell),
	    'buttons': {
		'Cancel': {},
		'Save New Solution': {
		    'id': 'save-solution-btn',
		    'class': 'btn-primary',
		    'click': function() {
			sol = {}
			sol[$('#output_type').val()] = $('#solution_text_area').val()
			cell.metadata.ordo_solution = sol
		    }
		},
	    },
	    'keyboard_manager': Jupyter.notebook.keyboard_manager,
	    'notebook': Jupyter.notebook
	})
    };

    var onEditSuccMsg = function(cell) {
	dialog.modal({
	    'title': 'Edit Success Messages',
	    'body': makeMessageInputArea(cell),
	    'buttons': {
		'Cancel': {},
		'Save New Message': {
		    'id': 'save-success-msg-btn',
		    'class': 'btn-primary',
		    'click': function() {
			if($('#styling').val() == "bold") {
			    sol = "<b>" + $('#message_text_area').val() + "</b>"
			} else {
			    sol = $('#message_text_area').val() 
			}
			cell.metadata.ordo_success = sol
		    }
		},
	    },
	    'keyboard_manager': Jupyter.notebook.keyboard_manager,
	    'notebook': Jupyter.notebook
	})
    };

    var onEditFailMsg = function(cell) {
	dialog.modal({
	    'title': 'Edit Failure Message',
	    'body': makeMessageInputArea(cell),
	    'buttons': {
		'Cancel': {},
		'Save New Message': {
		    'id': 'save-failure-msg-btn',
		    'class': 'btn-primary',
		    'click': function() {
			if($('#styling').val() == "bold") {
			    sol = "<b>" + $('#message_text_area').val() + "</b>"
			} else {
			    sol = $('#message_text_area').val() 
			}
			cell.metadata.ordo_failure = sol
		    }
		},
	    },
	    'keyboard_manager': Jupyter.notebook.keyboard_manager,
	    'notebook': Jupyter.notebook
	})
    }
    
    
    /**
     * creates the buttons and handles the functionality related to editing a solution
     */
    var editMetadataButtons = function() {
	var currCell = undefined;
	events.on('select.Cell', function(event, data) {
	    newCell = data.cell;
	    if(newCell == currCell){
		return;
	    } else if($('.ordo_edit_mode').length == 0) {
		return;
	    } else {
		$(".ordo-user-input").remove();
		currCell = newCell;
		if(currCell.cell_type == "code") {
		    $(".selected > .output_wrapper .output").append(ordoEditButtons);
		    $(".ordo-add-solution").on('click', (evt) => onEditSol(currCell));
		    $(".ordo-add-success-msg").on('click', (evt) => onEditSuccMsg(currCell));
		    $(".ordo-add-failure-msg").on('click', (evt) => onFailureSuccMsg(currCell));
		}
	    }
	}); 
    }
    
	/**
	 * html for the feedback buttons on a cell
	 */
	var ordoEditButtons = 
			"<div class='btn-group col-md-offset-1 ordo-user-input' role='group' aria-label='author input values'>" +
			"<button type='button' title='add solution' class='btn btn-default fa fa-plus ordo-add-solution' data-field='ordo_solution'> Solution </button>" +
			"<button type='button' title='add success message' class='btn btn-success fa fa-thumbs-o-up ordo-add-success-msg' data-field='ordo_success'> Message </button>" +
			"<button type='button' title='add failure message' class='btn btn-danger fa fa-thumbs-down ordo-add-failure-msg' data-field='ordo_failure'> Message </button>" +
		"</div>";
	
	/**
	 * html for the input box to create a feedback message
	 */
	var makeMessageInputArea = function() {
		var styles= [
			'bold',
			'plain text',
			'html'
		]
		
		$sel = $('<select />', {
			'class': "form-control",
			'id': "styling",
			'title': 'Select the styling for the following text'
		})
		$.each(styles, function(index, type) {
			$sel.append("<option>" + type + "</option>")
		})

		var inputArea = $('<div />', {
			'class': 'inputArea'
		}).append(
			$('<div />', {
				'title': 'Message Input Area'
			}).append(
				$('<form />', {
					'class': "form-inline"
				}).append($sel)
					.append(
						$('<textarea />', {
							'class': 'form-control',
							'id': 'message_text_area',
							'rows': '2',
							'style': 'width:70%',
							'title': 'Input text here!'
						}))
						.append(
							$('<button />', {
								'class': 'btn btn-default add-field',
								'title': 'Add another field'
							}).append(
								$('<span />', {
									'class': 'fa fa-plus'
								})
							)
						)
					.append($('<p />', {
						'class': 'form-text text-muted',
						'text': 'When html is selected, users may format their message using html as desired.'
					}))
				)
			) 
		return inputArea;
	}

	/**
	 * html for the input form to create a solution
	 */
    var makeSolutionInputArea = function(cell) {

	solution = cell.metadata.ordo_solution;
	console.debug("makeSolutionInputArea", solution);
	
		var output_types = [
			'text/plain',
			'text/html',
			'text/markdown',
			'text/latex',
			'image/svg+xml',
			'image/png',
			'image/jpeg',
			'application/javascript',
			'application/pdf',
			'python'
		]
		
		$sel = $('<select />', {
			'class': "form-control solution_type",
			'id': "output_type",
			'title': 'Select the output type'
		})
	    
	$.each(output_types, function(index, type) {
	    opt = $("<option>" + type + "</option>");
	    if (solution !== undefined && solution[type] !== undefined) {
		console.log(type, solution[type]);
		opt.attr('selected', true);
	    }
	    $sel.append(opt);
	})

		var inputArea = $('<div />', {
			'title': 'Solution Input Area'
		}).append(
			$('<form />', {
				'class': "form-inline"
			}).append($sel).append(
				$('<textarea />', {
					'class': 'form-control solution_text_area',
					'id': 'solution_text_area',
					'rows': '2',
					'style': 'width:65%',
					'title': 'Input text here!'
				})).append(
				$('<button />', {
					'class': 'btn btn-default',
					'title': 'Add another field'
				}).append(
					$('<span />', {
						'class': 'fa fa-plus'
					})
				)
			)
		)

	    if (solution !== undefined) {
	        $('#solution_text_area', inputArea).val(solutionToString(solution));
	    }
	    
	    return inputArea;
	}

    var ordo_exts = function() {
	return Jupyter.notebook.config.loaded.then(readConfig).then(initialize).catch(function on_error (reason) {
            console.error('Error:', reason);
        });
    }
    return {
	load_ipython_extension: ordo_exts
    }
});
