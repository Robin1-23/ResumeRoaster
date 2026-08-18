import ClassicTemplate from "./ClassicTemplate";
import ModernTemplate from "./ModernTemplate";
import CompactTemplate from "./CompactTemplate";
import ElegantTemplate from "./ElegantTemplate";
import CreativeTemplate from "./CreativeTemplate";
import RetroTemplate from "./RetroTemplate";
import type { ResumeTemplateProps } from "./types";

export { TEMPLATE_DEFINITIONS } from "./types";
export type { ResumeTemplateProps, TemplateDefinition } from "./types";

export const TEMPLATE_COMPONENTS: Record<
  string,
  (props: ResumeTemplateProps) => JSX.Element
> = {
  classic: ClassicTemplate,
  modern: ModernTemplate,
  compact: CompactTemplate,
  elegant: ElegantTemplate,
  creative: CreativeTemplate,
  retro: RetroTemplate
};

export const DEFAULT_TEMPLATE_ID = "classic";