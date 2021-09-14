// const { description } = require('../../../package')

module.exports = {
  title: "HTDP1",
  description: "htdp1 github pages",

  head: [
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  /**
   * Theme configuration, here is the default theme configuration for VuePress.
   *
   * ref：https://v1.vuepress.vuejs.org/theme/default-theme-config.html
   */
  themeConfig: {
    repo: "",
    editLinks: false,
    docsDir: "",
    editLinkText: "",
    lastUpdated: false,
    nav: [
      {
        text: "Guide",
        link: "/guide/",
      },
      {
        text: "Cloud",
        link: "/cloud/",
      },
      {
        text: "Ref. Arch.",
        link: "/refarch/",
      },
      {
        text: "Cloud.Native.App",
        link: "/cloud-native-app/",
      },
      {
        text: "M / L",
        link: "/machinelearning/",
      },
      {
        text: "GitOps",
        link: "/gitops/",
      },
    ],
    sidebar: {
      "/guide/": [
        {
          title: "Guide",
          collapsable: false,
          children: ["", "env", "doc"],
          sidebarDepth: 2,
        },
        {
          title: "Resource",
          collapsable: false,
          children: ["resource"],
        },
      ],
      "/cloud/": [
        {
          title: "Introduction",
          collapsable: false,
          children: [""],
        },
        {
          title: "AWS",
          collapsable: false,
          children: ["aws", "certi"],
        },
        {
          title: "Resources",
          collapsable: false,
          children: ["eks", "alb", "nlb", "ebs", "efs"],
        },
      ],
      "/refarch/": [
        {
          title: "Introduction",
          collapsable: false,
          children: [""],
          sidebarDepth: 2,
        },
        {
          title: "Redis",
          collapsable: false,
          children: ["", "perftest", "hatest"],
          sidebarDepth: 2,
        },
        {
          title: "EIP",
          collapsable: false,
          children: ["camel", "legacy"],
          sidebarDepth: 2,
        },
        {
          title: "KeyCloak",
          collapsable: false,
          children: ["keycloak"],
          sidebarDepth: 2,
        },
        {
          title: "Harbor",
          collapsable: false,
          children: ["harbor"],
          sidebarDepth: 2,
        },
      ],
      "/cloud-native-app/": [
        {
          title: "Cloud Native App",
          collapsable: false,
          children: ["", "container", "k8s", "restapi"],
          sidebarDepth: 1,
        },
        {
          title: "Springboot",
          collapsable: false,
          children: [
            "springboot/",
            "springboot/restapi",
            "springboot/bean",
            "springboot/env",
            "springboot/mybatis",
            "springboot/rest-client",
          ],
          sidebarDepth: 1,
        },
      ],
      "/machinelearning/": [
        {
          title: "Introduction",
          collapsable: false,
          children: [""],
          sidebarDepth: 2,
        },
        {
          title: "Jupyter",
          collapsable: false,
          children: [
            "jupyterintro",
            "jupyterserver",
            "jupyterhub",
            "jupyterproxy",
          ],
          sidebarDepth: 2,
        },
        {
          title: "Inference",
          collapsable: false,
          children: ["inferenceintro", "inferencetriton", "inferencekfserving"],
          sidebarDepth: 2,
        },
      ],
      "/gitops/": [
        {
          title: "Introduction",
          collapsable: false,
          children: ["", "gitopsintro"],
          sidebarDepth: 2,
        },
        {
          title: "FluxCD",
          collapsable: false,
          children: ["fluxintro", "fluxcdv2"],
          sidebarDepth: 2,
        },
        {
          title: "Flagger",
          collapsable: false,
          children: ["flaggerintro", "flaggerdeploy"],
          sidebarDepth: 2,
        },
        {
          title: "ArgoCD",
          collapsable: false,
          children: ["argocdintro","argocddeploy"],
          sidebarDepth: 2,
        },
      ],
      "/multi-cloud/": [
        {
          title: "Introduction",
          collapsable: false,
          children: ["", "diagram"],
          sidebarDepth: 2,
        },
      ],
    },
  },

  /**
   * Apply plugins，ref：https://v1.vuepress.vuejs.org/zh/plugin/
   */
  plugins: [
    "@vuepress/plugin-back-to-top",
    "@vuepress/plugin-medium-zoom",
    "@dovyp/vuepress-plugin-clipboard-copy",
  ],

  markdown: {
    extendMarkdown: (md) => {
      md.set({ breaks: true });
      md.use(require("markdown-it-plantuml"));
    },
    lineNumbers: true,
  },
};
