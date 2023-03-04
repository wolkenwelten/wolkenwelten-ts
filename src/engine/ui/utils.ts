/* Copyright 2023 - Benjamin Vincent Schulenburg
 * Licensed under the AGPL3+, for the full text see /LICENSE
 */
export const closest = (
    ele: HTMLElement | null,
    tagName: string
): HTMLElement | null => {
    if (!ele) {
        return null;
    }
    if (ele.tagName === tagName) {
        return ele;
    }
    return closest(ele.parentElement, tagName);
};

export interface DivData {
    tagname?: string;
    class?: string;
    classes?: string[];
    children?: (HTMLElement | '')[];
    src?: string;
    href?: string;
    title?: string;
    html?: string;
    text?: string;
    type?: string;
    value?: string;
    placeholder?: string;
    onClick?: (e: MouseEvent) => void;
    onContextmenu?: (e: MouseEvent) => void;
    onMousedown?: (e: MouseEvent) => void;
    attributes?: Record<string, string>;
}

export const Div = (data: DivData) => {
    const ret = document.createElement(data.tagname || 'DIV');
    for (const [k, v] of Object.entries(data)) {
        switch (k) {
            case 'class':
                ret.classList.add(v);
                break;
            case 'classes':
                for (const c of v) {
                    if (c) {
                        ret.classList.add(c);
                    }
                }
                break;
            case 'children':
                for (const child of v) {
                    if (child) {
                        ret.append(child);
                    }
                }
                break;
            case 'html':
                ret.innerHTML = v;
                break;
            case 'tagname':
                break;
            case 'text':
                ret.innerText = v;
                break;
            case 'onClick':
                ret.addEventListener('click', v);
                break;
            case 'onContextmenu':
                ret.addEventListener('contextmenu', v);
                break;
            case 'onMousedown':
                ret.addEventListener('mousedown', v);
                break;
            case 'attributes':
                if (data.attributes) {
                    for (const [attrKey, attrVal] of Object.entries(
                        data.attributes
                    )) {
                        ret.setAttribute(attrKey, attrVal);
                    }
                }
                break;
            default:
                ret.setAttribute(k, v);
                break;
        }
    }
    return ret;
};
export const Br = () => document.createElement('BR');
export const Hr = () => document.createElement('HR');
export const Span = (data: DivData) => Div({ ...data, tagname: 'SPAN' });
export const Center = (data: DivData) => Div({ ...data, tagname: 'CENTER' });
export const H2 = (data: DivData) => Div({ ...data, tagname: 'H2' });
export const H3 = (data: DivData) => Div({ ...data, tagname: 'H3' });
export const H4 = (data: DivData) => Div({ ...data, tagname: 'H4' });
export const Img = (data: DivData): HTMLImageElement =>
    Div({ ...data, tagname: 'IMG' }) as HTMLImageElement;
export const P = (data: DivData) => Div({ ...data, tagname: 'P' });
export const B = (data: DivData) => Div({ ...data, tagname: 'B' });
export const A = (data: DivData) => Div({ ...data, tagname: 'A' });
export const Button = (data: DivData) => Div({ ...data, tagname: 'BUTTON' });
export const TextInput = (data: DivData) =>
    Div({ ...data, type: 'text', tagname: 'INPUT' });
export const TextArea = (data: DivData) =>
    Div({ ...data, tagname: 'TEXTAREA' });
export const Checkbox = (data: DivData) =>
    Div({ ...data, type: 'checkbox', tagname: 'INPUT' });
export const Select = (data: DivData) => Div({ ...data, tagname: 'SELECT' });
export const Option = (data: DivData) => Div({ ...data, tagname: 'OPTION' });
export const Label = (data: DivData) => Div({ ...data, tagname: 'LABEL' });
