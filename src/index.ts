import Vue, { VueConstructor, CreateElement, VNode, ComponentOptions, PropOptions } from 'vue'

export const isElementNode = (node : MinifiedASTNode) : node is MinifedASTElement => {
  return node.hasOwnProperty('children')
}

export type MinifiedASTNode =  MinifiedASTText | MinifedASTElement

export interface MinifiedASTText {
  text: string
}

export interface MinifedASTElement {
  tag: string,
  attrsMap?: Record<string, string>
  children?: MinifiedASTNode[]
}

export interface IDimensions {
  height: number,
  width: number,
}

export interface IComponent extends Vue {
  scale: number | undefined
  fill: string
  dimension: IDimensions
}

function renderASTNode(h: CreateElement, ast: MinifiedASTNode) : VNode | string {
  if (isElementNode(ast)) {
    let children : Array<VNode | string> = []

    if (ast.children) {
      children = ast.children.map(child => renderASTNode(h, child))
    }

    return h(
      ast.tag,
      {
        attrs: ast.attrsMap
      },
      children
    )
  } else {
    return ast.text
  }
}

export const svgComponent = (svg : MinifedASTElement) : ComponentOptions<Vue> => {
  let component = {
    props: {
      scale: {
        type: [Number, Boolean],
        default: 1,
        required: false,
      },
      fill: {
        type: String,
        default: 'currentColor',
        required: false,
      }
    },
    inheritAttrs: false,
    computed: {
      dimension(this: IComponent) : IDimensions | {} {
        if (!this.scale || !svg.attrsMap || !svg.attrsMap.viewBox) {
          return {}
        }

        let splits = svg.attrsMap.viewBox.split(" ")

        return {
          width: Math.floor(parseInt(splits[2]) * this.scale),
          height: Math.floor(parseInt(splits[3]) * this.scale),
        }
      }
    },
    render(this: IComponent, h: CreateElement) {
      let scale = (this.scale ? this.dimension : {})
      let svgAttrs : Record<string, number | string> = {
        ...svg.attrsMap,
        'aria-hidden': 'true',
        fill: this.fill,
        ...scale,
        ...this.$attrs,
      }

      return h(
        svg.tag,
        {
          attrs: svgAttrs,
          on: this.$listeners
        },
        [
          this.$slots.default,
          ...(svg.children || []).map((c) => renderASTNode(h, c))
        ]
      )
    },
  }

  return component
}
