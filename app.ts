import * as CANNON from 'cannon-es';
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// THREE.BufferGeometry から CANNON.Trimesh を作成する関数
function createTrimesh(geometry: THREE.BufferGeometry) {
    const vertices = Array.from(geometry.attributes.position.array);
    const indices = Array.from({ length: geometry.index.count }, (_, i) => geometry.index.array[i]);

    return new CANNON.Trimesh(vertices, indices);
}

class ThreeJSContainer {
    private scene: THREE.Scene;
    private light: THREE.Light;
    private world: CANNON.World;

    constructor() {}

    // 画面部分の作成(表示する枠ごとに)
    public createRendererDOM = (width: number, height: number, cameraPos: THREE.Vector3) => {
        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        renderer.setClearColor(new THREE.Color(0x495ed));
        renderer.shadowMap.enabled = true; // シャドウマップを有効にする

        // カメラの設定
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        camera.position.copy(cameraPos);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        const orbitControls = new OrbitControls(camera, renderer.domElement);

        this.createScene();
        // 毎フレームのupdateを呼んで，render
        // requestAnimationFrame により次フレームを呼ぶ
        const render: FrameRequestCallback = (time) => {
            orbitControls.update();

            renderer.render(this.scene, camera);
            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);

        renderer.domElement.style.cssFloat = "left";
        renderer.domElement.style.margin = "10px";
        return renderer.domElement;
    }

    // シーンの作成(全体で1回)
    private createScene = () => {
        this.scene = new THREE.Scene();

        this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -9.82, 0) });
        this.world.defaultContactMaterial.friction = 0.01;
        this.world.defaultContactMaterial.restitution = 0.8;

        // 地面の作成
        // const planeGeometry = new THREE.PlaneGeometry(25, 25);
        // const phongMaterial = new THREE.MeshPhongMaterial();
        // const planeMesh = new THREE.Mesh(planeGeometry, phongMaterial);
        // planeMesh.material.side = THREE.DoubleSide; // 両面
        // planeMesh.rotateX(-Math.PI / 2);

        // this.scene.add(planeMesh);

        // // 物理空間での地面の作成
        // const planeShape = new CANNON.Plane()
        // const planeBody = new CANNON.Body({ mass: 0 }) // 重さゼロ 重力の影響を受けない
        // planeBody.addShape(planeShape)
        // planeBody.position.set(planeMesh.position.x, planeMesh.position.y, planeMesh.position.z);
        // planeBody.quaternion.set(planeMesh.quaternion.x, planeMesh.quaternion.y, planeMesh.quaternion.z, planeMesh.quaternion.w);
        // world.addBody(planeBody);

        // 山の作成
        const mountainBaseRadius = 10; // 山の底面の半径
        const mountainHeight = 4; // 山の高さ
        const mountainGeometry = new THREE.ConeGeometry(mountainBaseRadius, mountainHeight, 32);
        const mountainMaterial = new THREE.MeshLambertMaterial({ color: 0x92D050 });
        const mountainMesh = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountainMesh.material.side = THREE.DoubleSide;
        mountainMesh.position.set(0, mountainHeight / 2, 0); // 地面から持ち上げる

        this.scene.add(mountainMesh);

        // 物理エンジンでの山の設定
        const mountainShape = createTrimesh(mountainGeometry);
        const mountainBody = new CANNON.Body({ mass: 0 });
        mountainBody.addShape(mountainShape);
        mountainBody.position.set(mountainMesh.position.x, mountainMesh.position.y, mountainMesh.position.z);
        mountainBody.quaternion.set(mountainMesh.quaternion.x, mountainMesh.quaternion.y, mountainMesh.quaternion.z, mountainMesh.quaternion.w);
        this.world.addBody(mountainBody);

        // 丸いおにぎりを1秒ごとに作成
        setInterval(() => {
            this.createOnigiri();
        }, 600);

        // グリッド表示
        const gridHelper = new THREE.GridHelper(10);
        this.scene.add(gridHelper);

        // 軸表示
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // ライトの設定
        this.light = new THREE.DirectionalLight(0xffffff);
        const lvec = new THREE.Vector3(1, 1, 1).normalize();
        this.light.position.set(lvec.x, lvec.y, lvec.z);
        this.scene.add(this.light);

        let update: FrameRequestCallback = (time) => {
            this.world.fixedStep();

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }

    // 丸いおにぎりの作成
    private createOnigiri() {
        const onigiriRadius = 0.5;

        // テクスチャローダーを使って画像をロード
        const textureLoader = new THREE.TextureLoader();
        const texture = textureLoader.load('pic.png', (texture) => {
            // テクスチャがロードされた後の処理
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(1, 1);
        });

        // ランダムな初期位置を生成
        const randomPosition = () => Math.random() * 0.5 - 0.25;
        const xPos = randomPosition();
        const zPos = randomPosition();

        // 丸いおにぎりのジオメトリを作成
        const onigiriGeometry = new THREE.SphereGeometry(onigiriRadius, 32, 32);
        const onigiriMaterial = new THREE.MeshLambertMaterial({ map: texture }); // テクスチャをマテリアルに適用
        const onigiriMesh = new THREE.Mesh(onigiriGeometry, onigiriMaterial);
        // onigiriMesh.position.set(0.01, 6, 0); // 初期位置を山の上に設定
        onigiriMesh.position.set(xPos, 5, zPos); // ランダムな初期位置を設定

        this.scene.add(onigiriMesh);

        // 物理エンジンでの丸いおにぎりの設定
        const onigiriShape = new CANNON.Sphere(onigiriRadius);
        const onigiriBody = new CANNON.Body({ mass: 1 });
        onigiriBody.addShape(onigiriShape);
        onigiriBody.position.set(onigiriMesh.position.x, onigiriMesh.position.y, onigiriMesh.position.z);
        this.world.addBody(onigiriBody);

        // 丸いおにぎりと物理シミュレーションの位置同期
        let update: FrameRequestCallback = (time) => {
            this.world.fixedStep();
            // 位置の同期
            onigiriMesh.position.set(onigiriBody.position.x, onigiriBody.position.y, onigiriBody.position.z);
            // クォータニオンの同期
            onigiriMesh.quaternion.set(onigiriBody.quaternion.x, onigiriBody.quaternion.y, onigiriBody.quaternion.z, onigiriBody.quaternion.w);

            requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    }
}

window.addEventListener("DOMContentLoaded", init);

function init() {
    let container = new ThreeJSContainer();

    let viewport = container.createRendererDOM(640, 480, new THREE.Vector3(10, 10, 10));
    document.body.appendChild(viewport);
}
