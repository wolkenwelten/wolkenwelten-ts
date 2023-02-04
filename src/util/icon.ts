import { Game } from '../game';
import { blocks, BlockType } from '../world/blockType/blockType';

export class IconManager {
    game: Game;
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    constructor(game: Game) {
        this.game = game;
        this.canvas = document.createElement('canvas');
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            throw new Error("Couldn't create 2D context for building icons");
        }
        this.ctx = ctx;
    }

    buildBlockTypeIcon(bimg: HTMLImageElement, bt: BlockType) {
        this.canvas.width = 64;
        this.canvas.height = 64;
        const ctx = this.ctx;
        ctx.fillStyle = '#ff4020';
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, 64, 64);
        ctx.translate(32, 0);
        ctx.transform(0.75, 0, 0, 0.375, 0, 0);
        ctx.rotate(Math.PI / 4);
        ctx.drawImage(bimg, 0, bt.texTop * 64, 32, 32, 0, 0, 64, 64);

        ctx.resetTransform();
        ctx.translate(0, 48);
        ctx.transform(1, 0.5, 0, -0.5, 0, 0);
        ctx.filter = 'brightness(70%)';
        ctx.drawImage(bimg, 0, bt.texLeft * 64, 32, 32, 0, 0, 32, 64);

        ctx.resetTransform();
        ctx.translate(32, 64);
        ctx.transform(1, -0.5, 0, -0.5, 0, 0);
        ctx.filter = 'brightness(40%)';
        ctx.drawImage(bimg, 0, bt.texRight * 64, 32, 32, 0, 0, 32, 64);

        bt.icon = this.canvas.toDataURL('image/png');
    }

    buildAllBlockTypeIcons() {
        const that = this;
        const img = new Image();
        img.onload = () => {
            for (let i = 0; i < blocks.length; i++) {
                that.buildBlockTypeIcon(img, blocks[i]);
            }
            that.game.player.inventory.updateAll();
        };
        img.src = this.game.blockTextureUrl;
    }
}
