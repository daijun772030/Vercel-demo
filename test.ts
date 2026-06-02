// class pp {
//   name: string;
//   readonly code='123432';
//   constructor(name:string) {
//     this.name = name
//   }
// }
// class child extends pp {
//   age:number
//   constructor(age:number) {
//     super('1111');
//     this.age = age
//   }
// }
// const aa = new child(12);
// console.log(aa.age,aa.name,aa.code)

// //class类有get和set
// class tss {
//   private _size:number=0;
//   get size():number {
//     return this._size
//   }
//   set size(value:number | string) {
//     if(typeof value == 'string') this._size = 111111;
//     else this._size = value
//   }
// }

// let dd = new tss();
// console.log(dd.size);
// dd.size = '1222222';
// console.log(dd.size);
// setTimeout(() => {
//   dd.size = 123
//   console.log(dd.size)
// },3000)

// class MyClass {
//   [s:string]: boolean | ((s:string) => boolean)
//   checking(s:string) {
//     return this[s] as boolean
//   }
// }
// const mm = new MyClass();
// mm.dd = (val:string) => val.length>=0 ;
// console.log(mm.dd('1111'))

// interface Pingable {
//   ping?():void
//   pang?():void
// };
// class Sonar implements Pingable {
//   ping() {
//     console.log('dddddd')
//   }
// }
// const nn = new Sonar();
// console.log(nn.ping())
// class Soee implements Pingable {
//   ping() {
//     console.log('ddddd')
//   }
//   pang() {
//     console.log('pongddddd')
//   }
// }

class Base {
  name = 'Base';
  constructor() {
    console.log('this base name' + this.name)
  }
}
class Drived extends Base {
  name = "Drived"
}
const code = new Drived();
console.log(code.name)

//仅仅是对子类可见

class Prd {
   name:string = '';
   protected coding() {
    return '父节点'
   }
};

class Chid extends Prd {
  age:number = 12;
  fun() {
    return '直接点' + this.coding();
  }
}
const cc = new Chid();