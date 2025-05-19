cmake_minimum_required(VERSION 3.13)

# Define the library name
project(healthtracker)

# Explicitly set to use the shared STL
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fexceptions -frtti -std=c++20")
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--exclude-libs,libc++_shared.so")
set(CMAKE_SHARED_LINKER_FLAGS "${CMAKE_SHARED_LINKER_FLAGS} -Wl,--exclude-libs,libgcc.a")

# This file includes all the necessary to let you build your application with the New Architecture.
include(${REACT_ANDROID_DIR}/cmake-utils/ReactNative-application.cmake)

add_library(healthtracker_appmodules
            SHARED
            ${REACT_ANDROID_DIR}/ReactAndroid/src/main/jni/react/jni/ReactApplicationModuleIndex.cpp)

target_link_libraries(healthtracker_appmodules
                      -ljsi
                      -lreact_nativemodule_core
                      -lreact_render_componentregistry
                      -lreact_render_core
                      -lreact_codegen_rncore
                      -lfabricjni
                      -lreact_debug
                      -lfolly_runtime
                      -lglog
                      -lfbjni
                      -lruntimeexecutor
                      android) 