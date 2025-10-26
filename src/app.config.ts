export default defineAppConfig({
  pages: [
    'pages/login/index',
    'pages/register/index',
    'pages/home/index',
    'pages/class-list/index',
    'pages/create-class/index',
    'pages/join-class/index',
    'pages/class-detail/index',
    'pages/materials/index',
    'pages/material-upload/index',
    'pages/material-detail/index',
    'pages/tasks/index',
    'pages/pets/index',
    'pages/settings/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '学宠 LearnPet',
    navigationBarTextStyle: 'black'
  },
  // tabBar配置（需要图标文件，暂时注释）
  // 图标文件需要放在 src/assets/icons/ 目录下
  // 参考 src/assets/icons/README.md 获取图标要求
  /*
  tabBar: {
    color: '#999',
    selectedColor: '#1890ff',
    backgroundColor: '#fff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/icons/home.png',
        selectedIconPath: 'assets/icons/home-active.png'
      },
      {
        pagePath: 'pages/materials/index',
        text: '资料',
        iconPath: 'assets/icons/materials.png',
        selectedIconPath: 'assets/icons/materials-active.png'
      },
      {
        pagePath: 'pages/tasks/index',
        text: '任务',
        iconPath: 'assets/icons/tasks.png',
        selectedIconPath: 'assets/icons/tasks-active.png'
      },
      {
        pagePath: 'pages/pets/index',
        text: '宠物',
        iconPath: 'assets/icons/pets.png',
        selectedIconPath: 'assets/icons/pets-active.png'
      },
      {
        pagePath: 'pages/settings/index',
        text: '设置',
        iconPath: 'assets/icons/settings.png',
        selectedIconPath: 'assets/icons/settings-active.png'
      }
    ]
  }
  */
})
