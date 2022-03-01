import { CueNode, Entity } from "@hsubs/server";
import { Token } from "../Token.js";

export enum VTTEntities {
	VOICE /*******/ = 0b00000001,
	LANG /********/ = 0b00000010,
	RUBY /********/ = 0b00000100,
	RT /**********/ = 0b00001000,
	CLASS /*******/ = 0b00010000,
	BOLD /********/ = 0b00100000,
	ITALIC /******/ = 0b01000000,
	UNDERLINE /***/ = 0b10000000,
}

export type OpenTag = { index: number; token: Token };

const EntitiesTokenMap: { [key: string]: VTTEntities } = {
	v: VTTEntities.VOICE,
	lang: VTTEntities.LANG,
	ruby: VTTEntities.RUBY,
	rt: VTTEntities.RT,
	c: VTTEntities.CLASS,
	b: VTTEntities.BOLD,
	i: VTTEntities.ITALIC,
	u: VTTEntities.UNDERLINE,
};

export function isSupported(content: string): boolean {
	return Boolean(EntitiesTokenMap[content]);
}

export function completeMissing(openTags: OpenTag[], currentCue: CueNode): Entity[] {
	return openTags.map<Entity>((tag) => createEntity(tag, currentCue));
}

export function createEntity(tag: OpenTag, currentCue: CueNode): Entity {
	return {
		offset: tag.index,
		length: currentCue.content.length - tag.index,
		attributes: [tag.token.annotations],
		type: EntitiesTokenMap[tag.token.content],
	};
}
