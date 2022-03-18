cmake_minimum_required(VERSION 3.20.0)

if(WIN32)
  set(LISTENAI_HOME $ENV{USERPROFILE}/.listenai)
else()
  set(LISTENAI_HOME $ENV{HOME}/.listenai)
endif()
set(ZEPHYR_EXTRA_MODULES ${LISTENAI_HOME}/lisa-btest/framework/zephyr/1.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(example)

target_sources(app PRIVATE main.c)
