import type { CueNode, Entity, RawTrack } from "./model";
import type { IntervalBinaryLeaf } from "./IntervalBinaryTree.js";
import { IntervalBinaryTree } from "./IntervalBinaryTree.js";
import { HSBaseRendererConstructor } from "./BaseRenderer/index.js";

const activeTrackSymbol = Symbol("session.active");

export class HSSession {
	private timelines: { [lang: string]: IntervalBinaryTree<CueNode> } = Object.create(null);
	private [activeTrackSymbol]: string = null;

	constructor(rawContents: RawTrack[], public renderer: InstanceType<HSBaseRendererConstructor>) {
		for (let { lang, content } of rawContents) {
			try {
				const cues = renderer.parse(content);

				if (cues.length) {
					this.timelines[lang] = new IntervalBinaryTree();

					for (const cue of cues) {
						/**
						 * Reordering cues entities for a later reconciliation
						 * in captions presenter
						 */

						const cueTarget: CueNode = {
							...cue,
							entities: [...cue.entities].sort(reorderEntitiesComparisonFn),
						};

						this.timelines[lang].addNode(cueNodeToTreeLeaf(cueTarget));
					}
				}
			} catch (err) {
				console.error(err);
				/**
				 * @TODO Emit renderer error
				 */
			}
		}

		if (Object.keys(this.timelines).length) {
			this.activeTrack = Object.keys(this.timelines)[0];
		}
	}

	public getAll(): CueNode[] {
		return this.timelines[this[activeTrackSymbol]].getAll();
	}

	public get availableTracks(): string[] {
		return Object.keys(this.timelines);
	}

	public get activeTrack(): string {
		return this[activeTrackSymbol];
	}

	public set activeTrack(lang: string) {
		if (!this.timelines[lang]) {
			console.warn("Missing language. Active track wasn't set.");
			return;
		}

		this[activeTrackSymbol] = lang;
	}

	public getActiveCues(time: number): CueNode[] {
		if (!this.activeTrack) {
			throw new Error("No active track found. Cannot retrieve active cues");
		}

		return this.timelines[this.activeTrack].getCurrentNodes(time);
	}
}

function reorderEntitiesComparisonFn(e1: Entity, e2: Entity) {
	return e1.offset <= e2.offset || e1.length <= e2.length ? -1 : 1;
}

function cueNodeToTreeLeaf(cueNode: CueNode): IntervalBinaryLeaf<CueNode> {
	return {
		left: null,
		right: null,
		node: cueNode,
		get min() {
			return cueNode.startTime;
		},
		get max() {
			return cueNode.endTime;
		},
	};
}
