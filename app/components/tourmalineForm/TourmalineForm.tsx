// "use client";
// /*
// ---TODO---

// 	- Add a title for each tab with a brief description of what the tab is for
// 	- IMPORTANT: Refine the constraints and error messaging
//   - Filtering tab needs to be completed after discussions

// 	- More padding in containers that hold the form
// 	- Not making the message on metadata colummn red

// */

// import React, { useState } from "react";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// //import { getRemoteUrl } from '@/app/helpers/utils';
// import { serialize } from "object-to-formdata";
// import InfoButton from "@/app/components/InfoButton";
// import { schema, SchemaData } from "@/app/components/tourmalineForm/schema";

// import DenoiseMethodTab from "@/app/components/tourmalineForm/FormTabs/DenoiseMethodTab";
// import AboutTab from "@/app/components/tourmalineForm/FormTabs/AboutTab";
// import TaxonomicTab from "@/app/components/tourmalineForm/FormTabs/TaxonomicTab";
// import MsaTab from "@/app/components/tourmalineForm/FormTabs/MsaTab";
// import OutlierDetectionTab from "@/app/components/tourmalineForm/FormTabs/OutlierDetectionTab";
// import SubsamplingTab from "@/app/components/tourmalineForm/FormTabs/SubsamplingTab";
// import BetaGroupTab from "@/app/components/tourmalineForm/FormTabs/BetaGroupTab";
// import DeicodeBetaTab from "@/app/components/tourmalineForm/FormTabs/DeicodeBetaTab";
// import ThreadsTab from "@/app/components/tourmalineForm/FormTabs/ThreadsTab";
// import ReportThemeTab from "@/app/components/tourmalineForm/FormTabs/ReportThemeTab";
// import FilteringTab from "@/app/components/tourmalineForm/FormTabs/FilteringTab";
// import MetadataTab from "@/app/components/tourmalineForm/FormTabs/MetadataTab";

// export default function TourmalineForm() {
// 	const [activeTab, setActiveTab] = useState("About"); // Initial active tab
// 	const [formSubmitted, setFormSubmitted] = useState(false);

// 	//Array of tab order for page navigation buttons
// 	const tabOrder = [
// 		"About",
// 		"Denoise",
// 		"Taxonomic Level",
// 		"Multiple Sequence Alignment",
// 		"Outlier Detection",
// 		"Subsampling (Rarefaction)",
// 		"Beta Group Significance",
// 		"Deicode Beta Diversity",
// 		"Report Theme",
// 		"Filtering",
// 		"Metadata",
// 		"Submit"
// 	];

// 	function nextTab() {
// 		const currentIndex = tabOrder.indexOf(activeTab);
// 		const nextIndex = (currentIndex + 1) % tabOrder.length;
// 		setActiveTab(tabOrder[nextIndex]);
// 	}

// 	function prevTab() {
// 		const currentIndex = tabOrder.indexOf(activeTab);
// 		const previousIndex = (currentIndex - 1 + tabOrder.length) % tabOrder.length;
// 		setActiveTab(tabOrder[previousIndex]);
// 	}

// 	const {
// 		register,
// 		handleSubmit,
// 		formState: { isValid, errors },
// 		watch
// 	} = useForm<SchemaData>({
// 		resolver: zodResolver(schema),
// 		mode: "onBlur",
// 		//All default values can be set here
// 		defaultValues: {
// 			dada2pe_trunc_len_f: 240,
// 			dada2pe_trunc_len_r: 190,
// 			dada2pe_trim_left_f: 0,
// 			dada2pe_trim_left_r: 0,
// 			dada2pe_max_ee_f: 2,
// 			dada2pe_max_ee_r: 2,
// 			dada2pe_trunc_q: 2,
// 			dada2pe_pooling_method: "independent",
// 			dada2pe_chimera_method: "consensus",
// 			dada2pe_min_fold_parent_over_abundance: 1,
// 			dada2pe_n_reads_learn: 1000000,

// 			dada2se_trunc_len: 240,
// 			dada2se_trim_left: 0,
// 			dada2se_max_ee: 2,
// 			dada2se_trunc_q: 2,
// 			dada2se_pooling_method: "independent",
// 			dada2se_chimera_method: "consensus",
// 			dada2se_min_fold_parent_over_abundance: 1,
// 			dada2se_n_reads_learn: 1000000,

// 			deblur_trim_length: 240,
// 			deblur_sample_stats: "--p-no-sample-stats",
// 			deblur_mean_error: 0.005,
// 			deblur_indel_prob: 0.01,
// 			deblur_indel_max: 3,
// 			deblur_min_reads: 10,
// 			deblur_min_size: 2,

// 			taxClassMethod: "consensus-vsearch",
// 			taxonomicLevel: 7,

// 			msaMethod: "muscle",
// 			muscle_iters: 100,

// 			odseq_distance_metric: "linear",
// 			odseq_bootstrap_replicates: 100,
// 			odseq_threshold: 0.025,

// 			core_sampling_depth: 500,
// 			alpha_max_depth: 500,

// 			beta_group_column: "region",
// 			beta_group_method: "permanova",
// 			beta_group_pairwise: "--p-pairwise",

// 			deicode_min_sample_count: 500,
// 			deicode_min_feature_count: 10,
// 			deicode_min_feature_frequency: 0,
// 			deicode_max_iterations: 5,
// 			deicode_num_features: 5,

// 			report_theme: "github",

// 			filtering_election: "unfiltered"

// 			/*
// 			dada2pe_threads: 8,
// 			dada2se_threads: 8,
// 			deblur_threads: 8,
// 			alignment_threads: 8,
// 			feature_classifier_threads: 8,
// 			phylogeny_fasttree_threads: 8,
// 			diversity_core_metrics_phylogenetic_threads: 8,
// 			other_threads: 8
// 			*/
// 		}
// 	});

// 	// Watch for changes to the denoiseMethod field
// 	const selectedDenoiseMethod = watch("denoiseMethod");

// 	//Watch for msaMethod to render the muscle_iters field
// 	const selectedMsaMethod = watch("msaMethod");

// 	//Watch for rendering infobutton text based on taxonomic classifier method
// 	const selectedTaxClassifier = watch("taxClassMethod");

// 	// Manually register the file input field for metadata file
// 	// React.useEffect(() => {
// 	// register('metadataFile');
// 	// }, [register]);

// 	async function onSubmit(data: SchemaData) {
// 		console.log(data);
// 		const body = serialize(data); // convert SchemaData object to FormData
// 		// formData.append('denoiseMethod', data.denoiseMethod); // Append denoiseMethod to FormData
// 		// if(data.taxonomicLevel !== undefined) { // Ensure taxonomicLevel is defined before appending
// 		//   formData.append('taxonomicLevel', data.taxonomicLevel.toString()); // Convert taxonomicLevel to string and append
// 		// }

// 		// Append metadata file to FormData if it exists
// 		// if (data.metadataFile) {
// 		//   formData.append('metadataFile', data.metadataFile[0]); // Append the first file in the metadataFile FileList
// 		// }

// 		try {
// 			const response = await fetch(`/tourmalineReceive`, {
// 				method: "POST",
// 				headers: {
// 					"Content-Type": "multipart/form-data"
// 				},
// 				body // Send the FormData object as the body of the request
// 			});

// 			if (!response.ok) {
// 				throw new Error(`Server responded with status: ${response.status}`);
// 			}

// 			setFormSubmitted(true); // Indicate the form has been submitted successfully
// 			const result = await response.json();
// 			console.log(result); // Log the server response
// 		} catch (error) {
// 			console.error("Submission error:", error); // Log any errors
// 			setFormSubmitted(false); // Optionally reset formSubmitted to allow resubmission
// 		}
// 	}

// 	return (
// 		<div className="flex w-full bg-base-200 rounded-2xl">
// 			<ul className="menu bg-base-300 w-1/4 rounded-2xl">
// 				<li className={activeTab === "About" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("About")}>About</a>
// 				</li>
// 				<li className={activeTab === "Denoise" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Denoise")}>Denoise</a>
// 				</li>
// 				<li className={activeTab === "Taxonomic Level" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Taxonomic Level")}>Taxonomic Classification</a>
// 				</li>
// 				<li className={activeTab === "Multiple Sequence Alignment" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Multiple Sequence Alignment")}>Multiple Sequence Alignment</a>
// 				</li>
// 				<li className={activeTab === "Outlier Detection" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Outlier Detection")}>Outlier Detection</a>
// 				</li>
// 				<li className={activeTab === "Subsampling (Rarefaction)" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Subsampling (Rarefaction)")}>Subsampling (Rarefaction)</a>
// 				</li>
// 				<li className={activeTab === "Beta Group Significance" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Beta Group Significance")}>Beta Group Significance</a>
// 				</li>
// 				<li className={activeTab === "Deicode Beta Diversity" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Deicode Beta Diversity")}>Deicode Beta Diversity</a>
// 				</li>
// 				<li className={activeTab === "Report Theme" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Report Theme")}>Report Theme</a>
// 				</li>
// 				<li className={activeTab === "Filtering" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Filtering")}>Filtering</a>
// 				</li>
// 				{/* <li className={activeTab === 'Threads' ? 'bg-secondary text-white rounded-2xl' : ''}>
// 					<a onClick={() => setActiveTab('Threads')}>Threads</a>
// 				</li> */}
// 				<li className={activeTab === "Metadata" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Metadata")}>Metadata</a>
// 				</li>
// 				<li className={activeTab === "Submit" ? "bg-primary text-base-content rounded-2xl" : ""}>
// 					<a onClick={() => setActiveTab("Submit")}>Submit</a>
// 				</li>
// 			</ul>
// 			<div className="flex-grow p-1 flex flex-col items-center">
// 				<form onSubmit={handleSubmit(onSubmit)} className="flex flex-col w-full max-w-md h-full justify-between">
// 					{/* Tab rendering */}
// 					{activeTab === "About" && <AboutTab></AboutTab>}
// 					{activeTab === "Denoise" && (
// 						<DenoiseMethodTab
// 							register={register}
// 							errors={errors}
// 							selectedDenoiseMethod={selectedDenoiseMethod}
// 						></DenoiseMethodTab>
// 					)}
// 					{activeTab === "Taxonomic Level" && (
// 						<TaxonomicTab
// 							register={register}
// 							errors={errors}
// 							selectedTaxClassifier={selectedTaxClassifier} // Add the selectedTaxClassifier prop
// 						></TaxonomicTab>
// 					)}
// 					{activeTab === "Multiple Sequence Alignment" && (
// 						<>
// 							<MsaTab
// 								register={register}
// 								errors={errors}
// 								selectedMsaMethod={selectedMsaMethod || "muscle"} // Add a default value for selectedMsaMethod
// 							/>
// 						</>
// 					)}
// 					{activeTab === "Outlier Detection" && (
// 						<OutlierDetectionTab register={register} errors={errors}></OutlierDetectionTab>
// 					)}
// 					{activeTab === "Subsampling (Rarefaction)" && (
// 						<SubsamplingTab register={register} errors={errors}></SubsamplingTab>
// 					)}
// 					{activeTab === "Beta Group Significance" && <BetaGroupTab register={register} errors={errors}></BetaGroupTab>}
// 					{activeTab === "Deicode Beta Diversity" && (
// 						<DeicodeBetaTab register={register} errors={errors}></DeicodeBetaTab>
// 					)}
// 					{activeTab === "Report Theme" && <ReportThemeTab register={register} errors={errors}></ReportThemeTab>}
// 					{activeTab === "Filtering" && <FilteringTab register={register} errors={errors}></FilteringTab>}
// 					{/* {activeTab === 'Threads' && (
// 						//write me the 8 fields for threads
// 						<ThreadsTab register={register} errors={errors}></ThreadsTab>
// 					)} */}
// 					{activeTab === "Metadata" && <MetadataTab register={register} errors={errors}></MetadataTab>}
// 					{activeTab === "Submit" && (
// 						<div className="pt-24">
// 							<p className="text-md text-center text-secondary">
// 								Please carefully check all of your inputs before submitting. Remember: garbage in, garbage out.
// 							</p>
// 							<div className="flex justify-center p-4">
// 								<button
// 									type="submit"
// 									//Removed isDirty check, because it doesn't work if you dont change initial value of Denoise rendered fields
// 									disabled={!isValid || formSubmitted} // Submit button is disabled based on form state and submission status
// 									// className={`mt-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md ${!isDirty || !isValid || formSubmitted ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-700'} focus:outline-none text-white`}
// 									className="btn btn-secondary"
// 								>
// 									Submit
// 								</button>
// 							</div>
// 						</div>
// 					)}
// 					<div className="flex justify-center space-x-2 mt-4">
// 						<button type="button" className="btn btn-primary" onClick={prevTab}>
// 							«
// 						</button>
// 						<button type="button" className="btn btn-primary" onClick={nextTab}>
// 							»
// 						</button>
// 					</div>
// 				</form>
// 			</div>
// 		</div>
// 	);
// }
