/* eslint-disable prettier/prettier */
export function transformMenu(nestedMenus: any): any {
    function transform(menu: any): any {
      if (typeof menu === 'object' && !Array.isArray(menu)) {
        const transformed: any = {};
        for (const key in menu) {
          if (typeof menu[key] === 'object' && !Array.isArray(menu[key])) {
            transformed[key] = transform(menu[key]);
          } else if (Array.isArray(menu[key])) {
            transformed[key] = menu[key].reduce((acc, item) => {
              acc[item] = item;
              return acc;
            }, {});
          } else {
            transformed[key] = menu[key];
          }
        }
        return transformed;
      }
      return menu;
    }
  
    return transform(nestedMenus);
  }
  