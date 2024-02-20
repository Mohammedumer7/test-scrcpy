#
# Get pepper directory for toolchain and includes.
#
NACL_SDK_ROOT ?= C:\nacl\pepper_49

# Project Build flags
WARNINGS := -Wno-long-long -Wall -Wswitch-enum
CXXFLAGS := -pthread -std=gnu++14 $(WARNINGS)

#
# Compute tool paths
#
GETOS := python $(NACL_SDK_ROOT)/tools/getos.py
OSHELPERS = python $(NACL_SDK_ROOT)/tools/oshelpers.py
OSNAME := $(shell $(GETOS))
RM := $(OSHELPERS) rm

PNACL_TC_PATH := $(abspath $(NACL_SDK_ROOT)/toolchain/$(OSNAME)_pnacl)
PNACL_CXX := $(PNACL_TC_PATH)/bin/pnacl-clang++
PNACL_FINALIZE := $(PNACL_TC_PATH)/bin/pnacl-finalize
INCLUDES := -I$(NACL_SDK_ROOT)/include
LDFLAGS := -L$(NACL_SDK_ROOT)/lib/pnacl/Release -lppapi_gles2 -lppapi_cpp -lppapi -lpthread

#
# Disable DOS PATH warning when using Cygwin based tools Windows
#
CYGWIN ?= nodosfilewarning
export CYGWIN


all: stream_decoder.pexe

clean:
	$(RM) stream_decoder.pexe stream_decoder.bc

stream_decoder.bc: stream_decoder.cc
	$(PNACL_CXX) -o $@ $< -O3 $(INCLUDES) $(CXXFLAGS) $(LDFLAGS)

stream_decoder.pexe: stream_decoder.bc
	$(PNACL_FINALIZE) -o $@ $<