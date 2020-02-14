# binding.gyp
{
  'targets': [
    {
      'target_name': 'addon',
      'sources': [
        'src/hello.cc'
      ],
      'dependencies': [
      ]
    },
    {
      "target_name": "democpp",
      "sources": [
        "src/democpp.cc"
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [ 
        '-L/usr/local/Cellar/openssl@1.1/1.1.1d/lib -lssl -lcrypto',
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES"
      }
    }
  ]
}
